import { Router } from "express";
import { ListingStatus } from "../../../../generated/prisma/enums.js";
import { AppError } from "../../../domain/AppError.js";
import {
  adminListListingsQuerySchema,
  createListingBodySchema,
  orderBodySchema,
  updateListingBodySchema,
  type AdminListListingsQuery,
  type CreateListingBody,
  type UpdateListingBody,
} from "../../../domain/schemas/listingAdmin.js";
import { idParamSchema } from "../../../domain/schemas/userAdmin.js";
import type { AdminListingService } from "../../../services/adminListingService.js";
import { asyncHandler } from "../../asyncHandler.js";
import { created, noContent, ok } from "../../respond.js";
import {
  getValidatedParams,
  getValidatedQuery,
  validate,
} from "../../validation.js";

function requireUserId(req: { user?: { id: string } }): string {
  if (!req.user) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }
  return req.user.id;
}

export function createListingsAdminRouter(
  service: AdminListingService,
): Router {
  const r = Router();

  r.get(
    "/",
    validate({ query: adminListListingsQuerySchema }),
    asyncHandler(async (req, res) => {
      const q = getValidatedQuery<AdminListListingsQuery>(req);
      const result = await service.list(q);
      ok(res, result.items, {
        total: result.total,
        limit: q.limit,
        offset: q.offset,
      });
    }),
  );

  r.post(
    "/",
    validate({ body: createListingBodySchema }),
    asyncHandler(async (req, res) => {
      const actorId = requireUserId(req);
      const data = await service.create(actorId, req.body as CreateListingBody);
      created(res, data);
    }),
  );

  r.get(
    "/:id",
    validate({ params: idParamSchema }),
    asyncHandler(async (req, res) => {
      const { id } = getValidatedParams<{ id: string }>(req);
      const data = await service.getById(id);
      ok(res, data);
    }),
  );

  r.patch(
    "/:id",
    validate({ params: idParamSchema, body: updateListingBodySchema }),
    asyncHandler(async (req, res) => {
      const actorId = requireUserId(req);
      const { id } = getValidatedParams<{ id: string }>(req);
      const data = await service.update(
        actorId,
        id,
        req.body as UpdateListingBody,
      );
      ok(res, data);
    }),
  );

  r.delete(
    "/:id",
    validate({ params: idParamSchema }),
    asyncHandler(async (req, res) => {
      const actorId = requireUserId(req);
      const { id } = getValidatedParams<{ id: string }>(req);
      await service.delete(actorId, id);
      noContent(res);
    }),
  );

  r.post(
    "/:id/publish",
    validate({ params: idParamSchema }),
    asyncHandler(async (req, res) => {
      const actorId = requireUserId(req);
      const { id } = getValidatedParams<{ id: string }>(req);
      const data = await service.setStatus(actorId, id, ListingStatus.published);
      ok(res, data);
    }),
  );

  r.post(
    "/:id/unpublish",
    validate({ params: idParamSchema }),
    asyncHandler(async (req, res) => {
      const actorId = requireUserId(req);
      const { id } = getValidatedParams<{ id: string }>(req);
      const data = await service.setStatus(actorId, id, ListingStatus.draft);
      ok(res, data);
    }),
  );

  r.post(
    "/:id/feature",
    validate({ params: idParamSchema, body: orderBodySchema }),
    asyncHandler(async (req, res) => {
      const actorId = requireUserId(req);
      const { id } = getValidatedParams<{ id: string }>(req);
      const { order } = req.body as { order: number | null };
      const data = await service.setOrder(actorId, id, "featuredOrder", order);
      ok(res, data);
    }),
  );

  r.post(
    "/:id/trending",
    validate({ params: idParamSchema, body: orderBodySchema }),
    asyncHandler(async (req, res) => {
      const actorId = requireUserId(req);
      const { id } = getValidatedParams<{ id: string }>(req);
      const { order } = req.body as { order: number | null };
      const data = await service.setOrder(actorId, id, "trendingOrder", order);
      ok(res, data);
    }),
  );

  return r;
}
