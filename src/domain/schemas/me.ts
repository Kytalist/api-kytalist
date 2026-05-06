import { z } from "zod";

export const listingIdParamSchema = z.object({
  listingId: z.string().min(1),
});

export const applicationIdParamSchema = z.object({
  id: z.string().min(1),
});

export const applicationStatusSchema = z.enum([
  "draft",
  "submitted",
  "accepted",
  "rejected",
]);

export const createApplicationBodySchema = z
  .object({
    listingId: z.string().min(1),
    status: applicationStatusSchema.optional(),
    notes: z.string().max(5000).nullable().optional(),
  })
  .strip();

export const updateApplicationBodySchema = z
  .object({
    status: applicationStatusSchema.optional(),
    notes: z.string().max(5000).nullable().optional(),
  })
  .strip();

export type CreateApplicationBody = z.output<
  typeof createApplicationBodySchema
>;
export type UpdateApplicationBody = z.output<
  typeof updateApplicationBodySchema
>;
