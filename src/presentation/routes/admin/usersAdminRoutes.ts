import { Router } from "express";
import { AppError } from "../../../domain/AppError.js";
import {
  adminListUsersQuerySchema,
  idParamSchema,
  updateUserBodySchema,
  type AdminListUsersQuery,
  type UpdateUserBody,
} from "../../../domain/schemas/userAdmin.js";
import type { UserService } from "../../../services/userService.js";
import { asyncHandler } from "../../asyncHandler.js";
import { noContent, ok } from "../../respond.js";
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

export function createUsersAdminRouter(service: UserService): Router {
  const r = Router();

  r.get(
    "/",
    validate({ query: adminListUsersQuerySchema }),
    asyncHandler(async (req, res) => {
      const q = getValidatedQuery<AdminListUsersQuery>(req);
      const result = await service.list(q);
      ok(res, result.items, {
        total: result.total,
        limit: q.limit,
        offset: q.offset,
      });
    }),
  );

  r.patch(
    "/:id",
    validate({ params: idParamSchema, body: updateUserBodySchema }),
    asyncHandler(async (req, res) => {
      const actorId = requireUserId(req);
      const { id } = getValidatedParams<{ id: string }>(req);
      const data = await service.update(
        actorId,
        id,
        req.body as UpdateUserBody,
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

  return r;
}
