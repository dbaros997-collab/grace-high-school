import { pool } from "@workspace/db";

let cache: { at: number; ok: boolean } = { at: 0, ok: false };
const CACHE_MS = 5_000;

export async function isDatabaseReachable(force = false): Promise<boolean> {
  if (!force && Date.now() - cache.at < CACHE_MS) return cache.ok;
  try {
    await pool.query("SELECT 1");
    cache = { at: Date.now(), ok: true };
    return true;
  } catch {
    cache = { at: Date.now(), ok: false };
    return false;
  }
}

export function clearDatabaseHealthCache(): void {
  cache = { at: 0, ok: false };
}
