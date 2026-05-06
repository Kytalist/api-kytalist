import { Router } from "express";
import {
  createTestimonialBodySchema,
  idParamSchema,
  updateTestimonialBodySchema,
  type CreateTestimonialInput,
  type UpdateTestimonialInput,
} from "../../../domain/schemas/testimonials.js";
import type { TestimonialService } from "../../../services/testimonialService.js";
import { asyncHandler } from "../../asyncHandler.js";
import { created, noContent, ok } from "../../respond.js";
import { getValidatedParams, validate } from "../../validation.js";

export function createTestimonialsAdminRouter(
  service: TestimonialService,
): Router {
  const r = Router();

  r.get(
    "/",
    asyncHandler(async (_req, res) => {
      const data = await service.listAdmin();
      ok(res, data);
    }),
  );

  r.post(
    "/",
    validate({ body: createTestimonialBodySchema }),
    asyncHandler(async (req, res) => {
      const data = await service.create(req.body as CreateTestimonialInput);
      created(res, data);
    }),
  );

  r.patch(
    "/:id",
    validate({ params: idParamSchema, body: updateTestimonialBodySchema }),
    asyncHandler(async (req, res) => {
      const { id } = getValidatedParams<{ id: string }>(req);
      const data = await service.update(id, req.body as UpdateTestimonialInput);
      ok(res, data);
    }),
  );

  r.delete(
    "/:id",
    validate({ params: idParamSchema }),
    asyncHandler(async (req, res) => {
      const { id } = getValidatedParams<{ id: string }>(req);
      await service.delete(id);
      noContent(res);
    }),
  );

  return r;
}
