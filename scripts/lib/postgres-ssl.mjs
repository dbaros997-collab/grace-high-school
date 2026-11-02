/** Shared SSL decision for pg Pool (setup-db.mjs + documented for lib/db). */
export function postgresUsesSsl(connectionString) {
  if (process.env.PGSSL === "false") return false;
  if (process.env.PGSSL === "true") return true;
  if (/[?&]sslmode=(require|verify-full|verify-ca)/i.test(connectionString)) return true;
  if (/[?&]sslmode=disable/i.test(connectionString)) return false;
  return false;
}

export function postgresPoolSsl(connectionString) {
  return postgresUsesSsl(connectionString)
    ? { rejectUnauthorized: false }
    : undefined;
}
