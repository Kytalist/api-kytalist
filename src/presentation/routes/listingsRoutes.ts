import { Router } from "express";
import type { ListingService } from "../../services/listingService.js";
import { asyncHandler } from "../asyncHandler.js";
import { paramString, queryString } from "../queryUtils.js";

export function createListingsRouter(listingService: ListingService): Router {
  const r = Router();

  r.get(
    "/featured",
    asyncHandler(async (_req, res) => {
      const data = await listingService.listFeatured();
      res.json({ data });
    }),
  );

  r.get(
    "/",
    asyncHandler(async (req, res) => {
      const raw: Record<string, string | undefined> = {};
      for (const [k, v] of Object.entries(req.query)) {
        raw[k] = queryString(v);
      }
      const query = listingService.parseListQuery(raw);
      const data = await listingService.list(query);
      res.json({ data });
    }),
  );

  r.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = paramString(req.params["id"]) ?? "";
      const data = await listingService.getById(id);
      res.json({ data });
    }),
  );

  return r;
}
