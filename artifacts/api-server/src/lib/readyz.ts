import type { Response } from "express";

/** DB readiness — registered on the base app so it works even if /api routes fail to mount. */
export async function sendReadyzResponse(res: Response): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) {
    res.status(503).json({
      status: "error",
      database: "unconfigured",
      hint: "Set DATABASE_URL on Coolify and redeploy.",
    });
    return;
  }

  try {
    const { isDatabaseReachable } = await import("./dbHealth");
    if (await isDatabaseReachable(true)) {
      res.json({ status: "ok", database: "connected" });
      return;
    }
  } catch {
    // fall through
  }

  res.status(503).json({
    status: "error",
    database: "unavailable",
    hint: "Check DATABASE_URL and Postgres on Coolify, then redeploy.",
  });
}
