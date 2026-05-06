import cors from "cors";
import express from "express";
import { ListingRepository } from "../repositories/listingRepository.js";
import { ListingService } from "../services/listingService.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import { createHealthRouter } from "./routes/healthRoutes.js";
import { createListingsRouter } from "./routes/listingsRoutes.js";
import { createMetaRouter } from "./routes/metaRoutes.js";

export function createApp(): express.Express {
  const app = express();

  app.use(express.json({ limit: "1mb" }));

  const corsOrigins = process.env["CORS_ORIGIN"]?.split(",").map((s) => s.trim()).filter(Boolean);
  // Production: set CORS_ORIGIN (comma-separated). Local dev without it uses reflective origin.
  app.use(
    cors(
      corsOrigins && corsOrigins.length > 0
        ? { origin: corsOrigins }
        : { origin: true },
    ),
  );

  const listingService = new ListingService(new ListingRepository());

  app.use(createHealthRouter());
  app.use("/api/v1", createMetaRouter());
  app.use("/api/v1/listings", createListingsRouter(listingService));

  app.use(errorMiddleware);

  return app;
}
