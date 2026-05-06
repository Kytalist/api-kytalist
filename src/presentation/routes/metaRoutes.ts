import { Router } from "express";
import { getMetaPayload } from "../../services/metaService.js";
import { asyncHandler } from "../asyncHandler.js";

export function createMetaRouter(): Router {
  const r = Router();

  r.get(
    "/meta",
    asyncHandler(async (_req, res) => {
      res.json({ data: getMetaPayload() });
    }),
  );

  return r;
}
