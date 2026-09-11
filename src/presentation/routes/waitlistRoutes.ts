import { Router } from "express";
import {
  waitlistBodySchema,
  type WaitlistBody,
} from "../../domain/schemas/waitlist.js";
import type { WaitlistService } from "../../services/waitlistService.js";
import { asyncHandler } from "../asyncHandler.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { ok } from "../respond.js";
import { validate } from "../validation.js";

export function createWaitlistRouter(service: WaitlistService): Router {
  const r = Router();

  r.post(
    "/join",
    authLimiter,
    validate({ body: waitlistBodySchema }),
    asyncHandler(async (req, res) => {
      const { email } = req.body as WaitlistBody;
      const result = await service.join(email);
      ok(res, result);
    }),
  );

  r.get(
    "/count",
    asyncHandler(async (_req, res) => {
      const count = await service.count();
      ok(res, { count });
    }),
  );

  return r;
}
