import { Router } from "express";
import { AppError } from "../../domain/AppError.js";
import type { ContestSyncService } from "../../services/contestSyncService.js";
import { asyncHandler } from "../asyncHandler.js";
import { ok } from "../respond.js";

/**
 * Internal, secret-protected triggers for the contest ingestion job.
 * Mounted under /api/v1/internal/contests.
 */
export function createContestsInternalRouter(
  sync: ContestSyncService,
): Router {
  const r = Router();

  r.post(
    "/sync",
    asyncHandler(async (req, res) => {
      const secret = process.env["CRON_SECRET"];
      if (secret) {
        const provided =
          req.header("x-cron-secret") ??
          req.header("authorization")?.replace(/^Bearer\s+/i, "");
        if (provided !== secret) {
          throw new AppError("Forbidden", 403, "FORBIDDEN");
        }
      }
      const result = await sync.sync();
      ok(res, result);
    }),
  );

  return r;
}
