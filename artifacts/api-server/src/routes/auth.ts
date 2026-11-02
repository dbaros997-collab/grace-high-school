import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, staffUsersTable } from "@workspace/db";
import {
  LoginResponse,
  LogoutResponse,
  GetCurrentUserResponse,
  ResetPasswordBody,
  ResetPasswordResponse,
  GetSetupStatusResponse,
  SetupAdminResponse,
} from "@workspace/api-zod";
import {
  hashPassword,
  requireAuth,
  verifyResetSecret,
  ensurePasswordlessSession,
} from "../lib/auth";
import {
  DATABASE_UNAVAILABLE_MESSAGE,
  isPostgresConnectionError,
} from "../lib/pg-errors";

const router: IRouter = Router();

// Passwordless admin: setup is never required.
router.get("/auth/setup-status", async (_req, res): Promise<void> => {
  res.json(GetSetupStatusResponse.parse({ needsSetup: false }));
});

// Passwordless enter/setup — no credentials needed.
router.post("/auth/setup", async (req, res): Promise<void> => {
  try {
    const user = await ensurePasswordlessSession(req);
    req.log.info({ username: user.username }, "Passwordless admin session via setup");
    res.json(SetupAdminResponse.parse(user));
  } catch (err) {
    req.log.error({ err }, "Passwordless setup failed");
    if (isPostgresConnectionError(err)) {
      res.status(503).json({ error: DATABASE_UNAVAILABLE_MESSAGE });
      return;
    }
    res.status(500).json({ error: "Failed to open admin session." });
  }
});

// Passwordless login — ignores username/password body.
router.post("/auth/login", async (req, res): Promise<void> => {
  try {
    const user = await ensurePasswordlessSession(req);
    res.json(LoginResponse.parse(user));
  } catch (err) {
    req.log.error({ err }, "Passwordless login failed");
    if (isPostgresConnectionError(err)) {
      res.status(503).json({ error: DATABASE_UNAVAILABLE_MESSAGE });
      return;
    }
    res.status(500).json({ error: "Failed to open admin session." });
  }
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  req.session.destroy((err) => {
    if (err) {
      req.log.error({ err }, "Failed to destroy session");
      res.status(500).json({ error: "Failed to log out" });
      return;
    }
    res.clearCookie("connect.sid", { path: "/" });
    res.json(LogoutResponse.parse({ ok: true }));
  });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  res.json(
    GetCurrentUserResponse.parse({
      id: req.session.userId,
      username: req.session.username,
    }),
  );
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  // Kept for API compatibility; passwordless mode does not use passwords.
  const resetSecret = process.env.PASSWORD_RESET_SECRET;
  if (!resetSecret) {
    res.status(503).json({
      error: "Password reset is not configured on this server.",
    });
    return;
  }

  const parsed = ResetPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  if (!verifyResetSecret(parsed.data.resetCode, resetSecret)) {
    req.log.warn({ username: parsed.data.username }, "Failed password reset attempt");
    res.status(401).json({ error: "Invalid recovery code or username." });
    return;
  }

  const [user] = await db
    .select()
    .from(staffUsersTable)
    .where(eq(staffUsersTable.username, parsed.data.username));

  if (!user) {
    req.log.warn({ username: parsed.data.username }, "Failed password reset attempt");
    res.status(401).json({ error: "Invalid recovery code or username." });
    return;
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db
    .update(staffUsersTable)
    .set({ passwordHash })
    .where(eq(staffUsersTable.id, user.id));

  req.log.info({ username: user.username }, "Staff password reset via recovery code");
  res.json(ResetPasswordResponse.parse({ ok: true }));
});

export default router;
