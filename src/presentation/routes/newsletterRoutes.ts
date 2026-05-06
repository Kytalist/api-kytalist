import { Router } from "express";
import {
  confirmQuerySchema,
  subscribeBodySchema,
  type ConfirmQuery,
  type SubscribeBody,
} from "../../domain/schemas/newsletter.js";
import type { NewsletterService } from "../../services/newsletterService.js";
import { asyncHandler } from "../asyncHandler.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { ok } from "../respond.js";
import { getValidatedQuery, validate } from "../validation.js";

export function createNewsletterRouter(service: NewsletterService): Router {
  const r = Router();

  r.post(
    "/subscribe",
    authLimiter,
    validate({ body: subscribeBodySchema }),
    asyncHandler(async (req, res) => {
      const { email } = req.body as SubscribeBody;
      const result = await service.subscribe(email);
      ok(res, result);
    }),
  );

  r.get(
    "/confirm",
    validate({ query: confirmQuerySchema }),
    asyncHandler(async (req, res) => {
      const q = getValidatedQuery<ConfirmQuery>(req);
      const result = await service.confirm(q.token);
      ok(res, result);
    }),
  );

  r.get(
    "/unsubscribe",
    validate({ query: confirmQuerySchema }),
    asyncHandler(async (req, res) => {
      const q = getValidatedQuery<ConfirmQuery>(req);
      const result = await service.unsubscribe(q.token);
      ok(res, result);
    }),
  );

  return r;
}
