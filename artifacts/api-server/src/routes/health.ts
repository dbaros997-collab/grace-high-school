import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { sendReadyzResponse } from "../lib/readyz";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/readyz", async (_req, res): Promise<void> => {
  await sendReadyzResponse(res);
});

export default router;
