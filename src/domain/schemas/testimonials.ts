import { z } from "zod";

export const createTestimonialBodySchema = z
  .object({
    name: z.string().min(1).max(200),
    role: z.string().max(200).nullable().optional(),
    quote: z.string().min(1).max(2000),
    avatar: z.string().max(500).nullable().optional(),
    published: z.boolean().optional(),
    order: z.number().int().nullable().optional(),
  })
  .strip();

export const updateTestimonialBodySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    role: z.string().max(200).nullable().optional(),
    quote: z.string().min(1).max(2000).optional(),
    avatar: z.string().max(500).nullable().optional(),
    published: z.boolean().optional(),
    order: z.number().int().nullable().optional(),
  })
  .strip();

export const idParamSchema = z.object({ id: z.string().min(1) });

export type CreateTestimonialInput = z.output<
  typeof createTestimonialBodySchema
>;
export type UpdateTestimonialInput = z.output<
  typeof updateTestimonialBodySchema
>;
