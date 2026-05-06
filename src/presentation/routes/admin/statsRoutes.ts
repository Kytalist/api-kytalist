import { Router } from "express";
import type { StatsService } from "../../../services/statsService.js";
import { asyncHandler } from "../../asyncHandler.js";
import { ok } from "../../respond.js";

export function createStatsRouter(stats: StatsService): Router {
  const r = Router();

  r.get(
    "/",
    asyncHandler(async (_req, res) => {
      const data = await stats.getDashboard();
      ok(res, data);
    }),
  );

  return r;
}
