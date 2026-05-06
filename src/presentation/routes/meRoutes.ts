import { Router } from "express";
import { AppError } from "../../domain/AppError.js";
import {
  applicationIdParamSchema,
  createApplicationBodySchema,
  listingIdParamSchema,
  updateApplicationBodySchema,
  type CreateApplicationBody,
  type UpdateApplicationBody,
} from "../../domain/schemas/me.js";
import type { ApplicationService } from "../../services/applicationService.js";
import type { AuthService } from "../../services/authService.js";
import type { SavedListingService } from "../../services/savedListingService.js";
import { asyncHandler } from "../asyncHandler.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { created, noContent, ok } from "../respond.js";
import { getValidatedParams, validate } from "../validation.js";

function requireUserId(req: { user?: { id: string } }): string {
  if (!req.user) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }
  return req.user.id;
}

export type MeRouterDeps = {
  authService: AuthService;
  savedListingService: SavedListingService;
  applicationService: ApplicationService;
};

export function createMeRouter(deps: MeRouterDeps): Router {
  const r = Router();
  r.use(requireAuth(deps.authService));

  // Saved listings
  r.get(
    "/saved",
    asyncHandler(async (req, res) => {
      const userId = requireUserId(req);
      const data = await deps.savedListingService.list(userId);
      ok(res, data);
    }),
  );

  r.post(
    "/saved/:listingId",
    validate({ params: listingIdParamSchema }),
    asyncHandler(async (req, res) => {
      const userId = requireUserId(req);
      const { listingId } = getValidatedParams<{ listingId: string }>(req);
      const data = await deps.savedListingService.save(userId, listingId);
      created(res, data);
    }),
  );

  r.delete(
    "/saved/:listingId",
    validate({ params: listingIdParamSchema }),
    asyncHandler(async (req, res) => {
      const userId = requireUserId(req);
      const { listingId } = getValidatedParams<{ listingId: string }>(req);
      await deps.savedListingService.unsave(userId, listingId);
      noContent(res);
    }),
  );

  // Applications
  r.get(
    "/applications",
    asyncHandler(async (req, res) => {
      const userId = requireUserId(req);
      const data = await deps.applicationService.list(userId);
      ok(res, data);
    }),
  );

  r.post(
    "/applications",
    validate({ body: createApplicationBodySchema }),
    asyncHandler(async (req, res) => {
      const userId = requireUserId(req);
      const data = await deps.applicationService.create(
        userId,
        req.body as CreateApplicationBody,
      );
      created(res, data);
    }),
  );

  r.patch(
    "/applications/:id",
    validate({
      params: applicationIdParamSchema,
      body: updateApplicationBodySchema,
    }),
    asyncHandler(async (req, res) => {
      const userId = requireUserId(req);
      const { id } = getValidatedParams<{ id: string }>(req);
      const data = await deps.applicationService.update(
        userId,
        id,
        req.body as UpdateApplicationBody,
      );
      ok(res, data);
    }),
  );

  r.delete(
    "/applications/:id",
    validate({ params: applicationIdParamSchema }),
    asyncHandler(async (req, res) => {
      const userId = requireUserId(req);
      const { id } = getValidatedParams<{ id: string }>(req);
      await deps.applicationService.delete(userId, id);
      noContent(res);
    }),
  );

  return r;
}
