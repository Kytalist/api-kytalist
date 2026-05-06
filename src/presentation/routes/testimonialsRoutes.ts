import { Router } from "express";
import type { TestimonialService } from "../../services/testimonialService.js";
import { asyncHandler } from "../asyncHandler.js";
import { ok } from "../respond.js";

export function createTestimonialsRouter(service: TestimonialService): Router {
  const r = Router();

  r.get(
    "/",
    asyncHandler(async (_req, res) => {
      const data = await service.listPublic();
      ok(res, data);
    }),
  );

  return r;
}
