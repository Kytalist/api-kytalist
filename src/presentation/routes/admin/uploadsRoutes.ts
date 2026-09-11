import { Router } from "express";
import {
  imageUploadBodySchema,
  type ImageUploadBody,
} from "../../../domain/schemas/uploads.js";
import {
  createListingImageUploadUrl,
  createTestimonialAvatarUploadUrl,
} from "../../../infrastructure/storage.js";
import { asyncHandler } from "../../asyncHandler.js";
import { ok } from "../../respond.js";
import { validate } from "../../validation.js";

export function createUploadsRouter(): Router {
  const r = Router();

  r.post(
    "/listing-image",
    validate({ body: imageUploadBodySchema }),
    asyncHandler(async (req, res) => {
      const body = req.body as ImageUploadBody;
      const data = await createListingImageUploadUrl(body);
      ok(res, data);
    }),
  );

  r.post(
    "/testimonial-avatar",
    validate({ body: imageUploadBodySchema }),
    asyncHandler(async (req, res) => {
      const body = req.body as ImageUploadBody;
      const data = await createTestimonialAvatarUploadUrl(body);
      ok(res, data);
    }),
  );

  return r;
}
