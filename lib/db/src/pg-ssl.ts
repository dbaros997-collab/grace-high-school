/** Keep in sync with scripts/lib/postgres-ssl.mjs (setup-db uses the .mjs copy). */
export function postgresUsesSsl(connectionString: string): boolean {
  if (process.env.PGSSL === "false") return false;
  if (process.env.PGSSL === "true") return true;
  if (/render\.com/i.test(connectionString)) return true;
  if (/[?&]sslmode=(require|verify-full|verify-ca)/i.test(connectionString)) {
    return true;
  }
  if (/[?&]sslmode=disable/i.test(connectionString)) return false;
  return false;
}

export function postgresPoolSsl(
  connectionString: string,
): { rejectUnauthorized: false } | undefined {
  return postgresUsesSsl(connectionString)
    ? { rejectUnauthorized: false }
    : undefined;
}
