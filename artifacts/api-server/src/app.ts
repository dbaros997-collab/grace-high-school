import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { logger } from "./lib/logger";
import { registerStaticSites } from "./lib/staticSites";
import {
  DATABASE_UNAVAILABLE_MESSAGE,
  isPostgresConnectionError,
} from "./lib/pg-errors";

const isLocalDev =
  process.env.NODE_ENV !== "production" && process.env.REPL_ID === undefined;
const localOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function collectAllowedOrigins(): Set<string> {
  const origins = new Set<string>();

  for (const domain of (process.env.REPLIT_DOMAINS ?? "").split(",")) {
    const trimmed = domain.trim();
    if (trimmed) origins.add(`https://${trimmed}`);
  }

  for (const raw of (process.env.ALLOWED_ORIGINS ?? "").split(",")) {
    const trimmed = raw.trim();
    if (trimmed) origins.add(trimmed.replace(/\/$/, ""));
  }

  const renderUrl = process.env.RENDER_EXTERNAL_URL?.trim();
  if (renderUrl) {
    try {
      origins.add(new URL(renderUrl).origin);
    } catch {
      // ignore malformed RENDER_EXTERNAL_URL
    }
  }

  return origins;
}

const allowedOrigins = collectAllowedOrigins();

function isAllowedOrigin(origin: string): boolean {
  if (allowedOrigins.has(origin)) return true;
  if (isLocalDev && localOriginPattern.test(origin)) return true;

  try {
    const { hostname } = new URL(origin);
    if (hostname.endsWith(".onrender.com")) return true;
    if (
      hostname === "gracehighschoolgayaza.academy" ||
      hostname === "www.gracehighschoolgayaza.academy"
    ) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(err);
    return;
  }
  logger.error({ err }, "Unhandled request error");
  if (isPostgresConnectionError(err)) {
    res.status(503).json({ error: DATABASE_UNAVAILABLE_MESSAGE });
    return;
  }
  res.status(500).json({ error: "Internal server error" });
}

/** Minimal app: logging + health + static sites. No DB imports. */
export function createBaseApp(): Express {
  const app: Express = express();
  app.set("trust proxy", 1);

  app.use(
    pinoHttp({
      logger,
      serializers: {
        req(req) {
          return {
            id: req.id,
            method: req.method,
            url: req.url?.split("?")[0],
          };
        },
        res(res) {
          return {
            statusCode: res.statusCode,
          };
        },
      },
    }),
  );

  const healthPayload = { status: "ok" as const };
  app.get("/healthz", (_req, res) => {
    res.json(healthPayload);
  });
  app.get("/api/healthz", (_req, res) => {
    res.json(healthPayload);
  });

  // Serve public HTML/icons/sitemap before CORS so Googlebot and Cloudflare
  // can cache SEO assets without Vary: Origin / credential headers.
  registerStaticSites(app);

  app.use(
    cors({
      credentials: true,
      origin(origin, callback) {
        if (!origin || isAllowedOrigin(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
    }),
  );
  // Skip JSON parsing for local binary uploads so the raw body stream stays intact.
  const jsonParser = express.json();
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/storage/local-upload/")) {
      next();
      return;
    }
    jsonParser(req, res, next);
  });
  app.use(express.urlencoded({ extended: true }));

  return app;
}

/** Attach API routes + sessions after the HTTP server is already listening. */
export async function mountApiRoutes(app: Express): Promise<void> {
  const [{ sessionMiddleware }, { default: router }] = await Promise.all([
    import("./lib/session"),
    import("./routes"),
  ]);

  const { isDatabaseReachable } = await import("./lib/dbHealth");

  app.use("/api", async (req, res, next) => {
    if (
      req.path === "/healthz" ||
      req.path === "/readyz" ||
      req.path.startsWith("/storage/objects/")
    ) {
      next();
      return;
    }
    if (await isDatabaseReachable()) {
      next();
      return;
    }
    res.status(503).json({ error: DATABASE_UNAVAILABLE_MESSAGE });
  });

  app.use("/api", sessionMiddleware);
  app.use("/api", router);
  app.use(errorHandler);
  logger.info("API routes mounted");
}
