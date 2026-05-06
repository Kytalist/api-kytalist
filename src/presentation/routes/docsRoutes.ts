import { Router, type RequestHandler } from "express";
import swaggerUi from "swagger-ui-express";
import { buildOpenApiDocument } from "../openapi.js";

export function createDocsRouter(): Router | null {
  const isProd = process.env["NODE_ENV"] === "production";
  const enabledByFlag = process.env["DOCS_ENABLED"] === "true";
  if (isProd && !enabledByFlag) return null;

  const r = Router();
  const doc = buildOpenApiDocument();

  r.get("/openapi.json", (_req, res) => {
    res.json(doc);
  });

  const setup = swaggerUi.setup(doc as object) as unknown as RequestHandler;
  r.use("/", swaggerUi.serve as unknown as RequestHandler[], setup);

  return r;
}
