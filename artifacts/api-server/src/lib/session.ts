import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { randomBytes } from "node:crypto";
import { pool } from "@workspace/db";
import type { RequestHandler } from "express";
import { logger } from "./logger";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    username?: string;
  }
}

const PgStore = connectPgSimple(session);

const secretFromEnv = process.env.SESSION_SECRET?.trim();
const secret =
  secretFromEnv && secretFromEnv.length > 0
    ? secretFromEnv
    : randomBytes(32).toString("hex");

if (!secretFromEnv) {
  // Don't crash the whole deploy — API must still mount. Sessions won't survive
  // restarts until SESSION_SECRET is set stably in the server environment.
  logger.warn(
    "SESSION_SECRET is missing; using an ephemeral secret for this boot. Set SESSION_SECRET in Coolify so logins survive redeploys.",
  );
}

const isLocalDev =
  process.env.NODE_ENV !== "production" && process.env.REPL_ID === undefined;
const isReplit = process.env.REPL_ID !== undefined;

// Session table is created by ensureSchema() after the HTTP server listens.
// Session middleware backed by Postgres. The Replit preview runs in a
// cross-site iframe served over HTTPS via the shared proxy, so the cookie must
// be SameSite=None + Secure, and the app must trust the proxy (set in app.ts).
export const sessionMiddleware: RequestHandler = session({
  store: new PgStore({
    pool,
    tableName: "session",
    // Safer on free-tier deploys where schema bootstrap can race the first request.
    createTableIfMissing: true,
  }),
  secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: !isLocalDev,
    // Replit preview iframe needs None; same-host Coolify/Render uses Lax on /dashboard → /api.
    sameSite: isLocalDev || !isReplit ? "lax" : "none",
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
});
