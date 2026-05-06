import { Router } from "express";
import {
  listingImageUploadBodySchema,
  type ListingImageUploadBody,
} from "../../../domain/schemas/uploads.js";
import { createListingImageUploadUrl } from "../../../infrastructure/storage.js";
import { asyncHandler } from "../../asyncHandler.js";
import { ok } from "../../respond.js";
import { validate } from "../../validation.js";

export function createUploadsRouter(): Router {
  const r = Router();

  r.post(
    "/listing-image",
    validate({ body: listingImageUploadBodySchema }),
    asyncHandler(async (req, res) => {
      const body = req.body as ListingImageUploadBody;
      const data = await createListingImageUploadUrl(body);
      ok(res, data);
    }),
  );

  return r;
}
