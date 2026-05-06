import cors from "cors";
import express, { type RequestHandler } from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { getLogger } from "../infrastructure/logger.js";
import { ApplicationRepository } from "../repositories/applicationRepository.js";
import { AuditRepository } from "../repositories/auditRepository.js";
import { ListingRepository } from "../repositories/listingRepository.js";
import { SavedListingRepository } from "../repositories/savedListingRepository.js";
import { SubscriberRepository } from "../repositories/subscriberRepository.js";
import { TestimonialRepository } from "../repositories/testimonialRepository.js";
import { UserRepository } from "../repositories/userRepository.js";
import { AdminListingService } from "../services/adminListingService.js";
import { ApplicationService } from "../services/applicationService.js";
import { AuditService } from "../services/auditService.js";
import { AuthService } from "../services/authService.js";
import { ListingService } from "../services/listingService.js";
import { MetaService } from "../services/metaService.js";
import { NewsletterService } from "../services/newsletterService.js";
import { SavedListingService } from "../services/savedListingService.js";
import { StatsService } from "../services/statsService.js";
import { TestimonialService } from "../services/testimonialService.js";
import { UserService } from "../services/userService.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import { authLimiter, globalLimiter } from "./middleware/rateLimit.js";
import { requestId } from "./middleware/requestId.js";
import { createAdminRouter } from "./routes/admin/index.js";
import { createAuthRouter } from "./routes/authRoutes.js";
import { createDocsRouter } from "./routes/docsRoutes.js";
import { createHealthRouter } from "./routes/healthRoutes.js";
import { createListingsRouter } from "./routes/listingsRoutes.js";
import { createMeRouter } from "./routes/meRoutes.js";
import { createMetaRouter } from "./routes/metaRoutes.js";
import { createNewsletterRouter } from "./routes/newsletterRoutes.js";
import { createTestimonialsRouter } from "./routes/testimonialsRoutes.js";

/** Replace `?token=...` and `&token=...` values with `***` for log safety. */
function scrubTokens(url: string): string {
  return url.replace(/([?&]token=)[^&]+/gi, "$1***");
}

export function createApp(): express.Express {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(helmet() as unknown as RequestHandler);
  app.use(requestId);
  app.use(
    pinoHttp({
      logger: getLogger(),
      genReqId: (req) => (req as { id?: string }).id ?? "",
      customLogLevel: (_req, res, err) => {
        if (err) return "error";
        if (res.statusCode >= 500) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
      },
      serializers: {
        req: (req: { method?: string; url?: string; id?: string }) => {
          const url = typeof req.url === "string" ? scrubTokens(req.url) : req.url;
          return { method: req.method, url, id: req.id };
        },
      },
    }) as unknown as RequestHandler,
  );

  app.use(express.json({ limit: "1mb" }) as unknown as RequestHandler);

  const corsOrigins = process.env["CORS_ORIGIN"]
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  app.use(
    cors(
      corsOrigins && corsOrigins.length > 0
        ? { origin: corsOrigins }
        : { origin: true },
    ),
  );

  app.use(globalLimiter);

  // Repositories
  const userRepository = new UserRepository();
  const listingRepository = new ListingRepository();
  const auditRepository = new AuditRepository();
  const subscriberRepository = new SubscriberRepository();
  const testimonialRepository = new TestimonialRepository();
  const savedListingRepository = new SavedListingRepository();
  const applicationRepository = new ApplicationRepository();

  // Services
  const auditService = new AuditService(auditRepository);
  const authService = new AuthService(userRepository);
  const listingService = new ListingService(listingRepository);
  const metaService = new MetaService(listingRepository);
  const adminListingService = new AdminListingService(
    listingRepository,
    auditService,
  );
  const userService = new UserService(userRepository, auditService);
  const statsService = new StatsService(listingRepository, userRepository);
  const newsletterService = new NewsletterService(subscriberRepository);
  const testimonialService = new TestimonialService(testimonialRepository);
  const savedListingService = new SavedListingService(savedListingRepository);
  const applicationService = new ApplicationService(applicationRepository);

  // Public + auth routes
  app.use(createHealthRouter());
  app.use("/api/v1", createMetaRouter(metaService));
  app.use("/api/v1/listings", createListingsRouter(listingService));
  app.use("/api/v1/auth", authLimiter, createAuthRouter(authService));
  app.use("/api/v1/newsletter", createNewsletterRouter(newsletterService));
  app.use("/api/v1/testimonials", createTestimonialsRouter(testimonialService));
  app.use(
    "/api/v1/me",
    createMeRouter({
      authService,
      savedListingService,
      applicationService,
    }),
  );

  // Optional API docs
  const docsRouter = createDocsRouter();
  if (docsRouter) {
    app.use("/api/v1/docs", docsRouter);
  }

  // Admin routes (protected by requireAuth + requireRole inside the router)
  app.use(
    "/api/v1/admin",
    createAdminRouter({
      authService,
      adminListingService,
      userService,
      auditService,
      statsService,
      newsletterService,
      testimonialService,
    }),
  );

  app.use(errorMiddleware);

  return app;
}
