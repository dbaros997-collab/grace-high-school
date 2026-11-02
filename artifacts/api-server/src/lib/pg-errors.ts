export function isPostgresConnectionError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as { code?: string }).code;
  if (!code) return false;
  return (
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "ETIMEDOUT" ||
    code === "ECONNRESET" ||
    code === "57P01" ||
    code === "28P01" ||
    code === "3D000" ||
    code === "53300"
  );
}

export const DATABASE_UNAVAILABLE_MESSAGE =
  "Database unavailable. In Coolify, add a PostgreSQL database, set DATABASE_URL on this app, and redeploy.";
