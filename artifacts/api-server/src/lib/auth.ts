import {
  randomBytes,
  scrypt as scryptCb,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";
import type { Request, Response, NextFunction } from "express";
import { db, staffUsersTable } from "@workspace/db";
import {
  DATABASE_UNAVAILABLE_MESSAGE,
  isPostgresConnectionError,
} from "./pg-errors";

const scrypt = promisify(scryptCb);
const KEYLEN = 64;

// Hash a plaintext password as `scrypt:<saltHex>:<hashHex>`.
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, KEYLEN)) as Buffer;
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
}

// Verify a plaintext password against a stored `scrypt:salt:hash` string.
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1]!, "hex");
  const expected = Buffer.from(parts[2]!, "hex");
  const derived = (await scrypt(password, salt, expected.length)) as Buffer;
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

// Compare a recovery code to PASSWORD_RESET_SECRET without leaking timing info.
export function verifyResetSecret(provided: string, expected: string): boolean {
  const providedHash = createHash("sha256").update(provided).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(providedHash, expectedHash);
}

function saveSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.save((err) => (err ? reject(err) : resolve()));
  });
}

/**
 * Ensure there is a staff row and attach it to the session.
 * Used for passwordless dashboard access — no password is checked.
 */
export async function ensurePasswordlessSession(req: Request): Promise<{
  id: number;
  username: string;
}> {
  if (req.session.userId && req.session.username) {
    return { id: req.session.userId, username: req.session.username };
  }

  const existing = await db.select().from(staffUsersTable).limit(1);
  let user = existing[0];

  if (!user) {
    const passwordHash = await hashPassword(randomBytes(24).toString("hex"));
    const inserted = await db
      .insert(staffUsersTable)
      .values({ username: "admin", passwordHash })
      .returning();
    user = inserted[0];
    if (!user) {
      throw new Error("Failed to create passwordless admin account");
    }
  }

  req.session.userId = user.id;
  req.session.username = user.username;
  await saveSession(req);
  return { id: user.id, username: user.username };
}

// Express middleware: open the admin API without a password.
// If there is no session yet, create/reuse the staff account automatically.
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  void (async () => {
    try {
      await ensurePasswordlessSession(req);
      next();
    } catch (err) {
      if (isPostgresConnectionError(err)) {
        res.status(503).json({ error: DATABASE_UNAVAILABLE_MESSAGE });
        return;
      }
      next(err);
    }
  })();
}
