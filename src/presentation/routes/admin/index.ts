import { Router } from "express";
import type { AdminListingService } from "../../../services/adminListingService.js";
import type { AuditService } from "../../../services/auditService.js";
import type { AuthService } from "../../../services/authService.js";
import type { NewsletterService } from "../../../services/newsletterService.js";
import type { StatsService } from "../../../services/statsService.js";
import type { TestimonialService } from "../../../services/testimonialService.js";
import type { UserService } from "../../../services/userService.js";
import {
  requireAuth,
  requireRole,
} from "../../middleware/authMiddleware.js";
import { writeLimiter } from "../../middleware/rateLimit.js";
import { createAuditRouter } from "./auditRoutes.js";
import { createListingsAdminRouter } from "./listingsAdminRoutes.js";
import { createNewsletterAdminRouter } from "./newsletterAdminRoutes.js";
import { createStatsRouter } from "./statsRoutes.js";
import { createTestimonialsAdminRouter } from "./testimonialsAdminRoutes.js";
import { createUploadsRouter } from "./uploadsRoutes.js";
import { createUsersAdminRouter } from "./usersAdminRoutes.js";

export type AdminRouterDeps = {
  authService: AuthService;
  adminListingService: AdminListingService;
  userService: UserService;
  auditService: AuditService;
  statsService: StatsService;
  newsletterService: NewsletterService;
  testimonialService: TestimonialService;
};

export function createAdminRouter(deps: AdminRouterDeps): Router {
  const r = Router();
  r.use(requireAuth(deps.authService));
  r.use(requireRole("admin"));
  r.use(writeLimiter);

  r.use("/listings", createListingsAdminRouter(deps.adminListingService));
  r.use("/users", createUsersAdminRouter(deps.userService));
  r.use("/audit-logs", createAuditRouter(deps.auditService));
  r.use("/stats", createStatsRouter(deps.statsService));
  r.use("/newsletter", createNewsletterAdminRouter(deps.newsletterService));
  r.use("/testimonials", createTestimonialsAdminRouter(deps.testimonialService));
  r.use("/uploads", createUploadsRouter());

  return r;
}
