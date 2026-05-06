import { Router } from "express";
import { AppError } from "../../domain/AppError.js";
import type { AuthService } from "../../services/authService.js";
import { asyncHandler } from "../asyncHandler.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { ok } from "../respond.js";

export function createAuthRouter(authService: AuthService): Router {
  const r = Router();

  r.get(
    "/me",
    requireAuth(authService),
    asyncHandler(async (req, res) => {
      if (!req.user) {
        throw new AppError("Authentication required", 401, "UNAUTHORIZED");
      }
      const data = await authService.getMe(req.user.id);
      ok(res, data);
    }),
  );

  return r;
}
