import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { postgresPoolSsl } from "./pg-ssl";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const connectionString = process.env.DATABASE_URL;

if (/render\.com/i.test(connectionString)) {
  console.error(
    "[db] DATABASE_URL points at Render. Use Coolify PostgreSQL internal URL instead.",
  );
}

export const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 30_000,
  max: 10,
  ssl: postgresPoolSsl(connectionString),
});
export const db = drizzle(pool, { schema });

export * from "./schema";
