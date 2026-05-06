import { Router } from "express";
import {
  adminListSubscribersQuerySchema,
  broadcastBodySchema,
  type AdminListSubscribersQuery,
  type BroadcastBody,
} from "../../../domain/schemas/newsletter.js";
import type { NewsletterService } from "../../../services/newsletterService.js";
import { asyncHandler } from "../../asyncHandler.js";
import { ok } from "../../respond.js";
import { getValidatedQuery, validate } from "../../validation.js";

export function createNewsletterAdminRouter(
  service: NewsletterService,
): Router {
  const r = Router();

  r.get(
    "/subscribers",
    validate({ query: adminListSubscribersQuerySchema }),
    asyncHandler(async (req, res) => {
      const q = getValidatedQuery<AdminListSubscribersQuery>(req);
      const result = await service.list({
        ...(q.status ? { status: q.status } : {}),
        limit: q.limit,
        offset: q.offset,
      });
      ok(res, result.items, {
        total: result.total,
        limit: q.limit,
        offset: q.offset,
      });
    }),
  );

  r.post(
    "/broadcast",
    validate({ body: broadcastBodySchema }),
    asyncHandler(async (req, res) => {
      const result = service.broadcast(req.body as BroadcastBody);
      res.status(202).json({ data: result });
    }),
  );

  return r;
}
