import { Router } from "express";
import { z } from "zod";
import type { AuditService } from "../../../services/auditService.js";
import { asyncHandler } from "../../asyncHandler.js";
import { ok } from "../../respond.js";
import { getValidatedQuery, validate } from "../../validation.js";

const querySchema = z
  .object({
    entityType: z.string().optional().transform((v) => v?.trim() || undefined),
    entityId: z.string().optional().transform((v) => v?.trim() || undefined),
    actorId: z.string().optional().transform((v) => v?.trim() || undefined),
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional(),
    limit: z
      .string()
      .optional()
      .transform((v) => (v === undefined || v === "" ? 50 : Number(v)))
      .refine((n) => Number.isInteger(n) && n >= 1 && n <= 500),
    offset: z
      .string()
      .optional()
      .transform((v) => (v === undefined || v === "" ? 0 : Number(v)))
      .refine((n) => Number.isInteger(n) && n >= 0),
  })
  .strip();

type Query = z.output<typeof querySchema>;

export function createAuditRouter(audit: AuditService): Router {
  const r = Router();

  r.get(
    "/",
    validate({ query: querySchema }),
    asyncHandler(async (req, res) => {
      const q = getValidatedQuery<Query>(req);
      const result = await audit.list({
        ...(q.entityType ? { entityType: q.entityType } : {}),
        ...(q.entityId ? { entityId: q.entityId } : {}),
        ...(q.actorId ? { actorId: q.actorId } : {}),
        ...(q.from ? { from: new Date(q.from) } : {}),
        ...(q.to ? { to: new Date(q.to) } : {}),
        limit: q.limit,
        offset: q.offset,
      });
      ok(res, result.items, {
        total: result.total,
        limit: q.limit,
        offset: q.offset,
      });
    }),
  );

  return r;
}
