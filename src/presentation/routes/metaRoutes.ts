import { Router } from "express";
import {
  getMetaPayload,
  type MetaService,
} from "../../services/metaService.js";
import { asyncHandler } from "../asyncHandler.js";
import { ok } from "../respond.js";

export function createMetaRouter(metaService: MetaService): Router {
  const r = Router();

  r.get(
    "/meta",
    asyncHandler(async (_req, res) => {
      ok(res, getMetaPayload());
    }),
  );

  r.get(
    "/meta/counts",
    asyncHandler(async (_req, res) => {
      const counts = await metaService.getCategoryCounts();
      ok(res, counts);
    }),
  );

  return r;
}
