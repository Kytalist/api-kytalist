import { Router } from "express";
import {
  listingIdParamsSchema,
  listListingsQuerySchema,
  type ListListingsQueryParsed,
} from "../../domain/schemas/listings.js";
import type { ListingService } from "../../services/listingService.js";
import { asyncHandler } from "../asyncHandler.js";
import { ok } from "../respond.js";
import {
  getValidatedParams,
  getValidatedQuery,
  validate,
} from "../validation.js";

export function createListingsRouter(listingService: ListingService): Router {
  const r = Router();

  r.get(
    "/featured",
    asyncHandler(async (_req, res) => {
      const data = await listingService.listFeatured();
      ok(res, data);
    }),
  );

  r.get(
    "/trending",
    asyncHandler(async (_req, res) => {
      const data = await listingService.listTrending();
      ok(res, data);
    }),
  );

  r.get(
    "/",
    validate({ query: listListingsQuerySchema }),
    asyncHandler(async (req, res) => {
      const query = getValidatedQuery<ListListingsQueryParsed>(req);
      const result = await listingService.list(query);
      ok(res, result.items, {
        total: result.total,
        limit: query.limit,
        offset: query.offset,
      });
    }),
  );

  r.get(
    "/:id",
    validate({ params: listingIdParamsSchema }),
    asyncHandler(async (req, res) => {
      const { id } = getValidatedParams<{ id: string }>(req);
      const data = await listingService.getById(id);
      ok(res, data);
    }),
  );

  return r;
}
