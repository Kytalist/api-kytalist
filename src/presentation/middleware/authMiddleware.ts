import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { UserRole } from "../../../generated/prisma/enums.js";
import { AppError } from "../../domain/AppError.js";
import { verifyAccessToken } from "../../infrastructure/supabaseAuth.js";
import type { AuthService } from "../../services/authService.js";

function extractBearer(req: Request): string | null {
  const h = req.header("authorization") ?? req.header("Authorization");
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m && m[1] ? m[1].trim() : null;
}

/**
 * Verifies the Supabase access JWT, lazy-upserts the local User row,
 * and attaches `req.user = { id, email, role }`.
 */
export function requireAuth(authService: AuthService): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const token = extractBearer(req);
      if (!token) {
        throw new AppError("Missing bearer token", 401, "UNAUTHORIZED");
      }
      const payload = await verifyAccessToken(token);
      const user = await authService.syncFromAuthToken(payload);
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function requireRole(role: UserRole): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new AppError("Authentication required", 401, "UNAUTHORIZED"));
      return;
    }
    if (req.user.role !== role) {
      next(new AppError("Forbidden", 403, "FORBIDDEN"));
      return;
    }
    next();
  };
}
