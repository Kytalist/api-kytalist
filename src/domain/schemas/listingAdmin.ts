import { z } from "zod";
import {
  costOptionSchema,
  extracurricularTypeSchema,
  listingCategorySchema,
} from "./listings.js";

export const listingStatusSchema = z.enum(["draft", "published", "archived"]);

const baseListingFields = {
  title: z.string().min(1).max(500),
  org: z.string().min(1).max(500),
  location: z.string().min(1).max(500),
  region: z.string().min(1).max(200),
  description: z.string().min(1),
  image: z.string().min(1),
  category: listingCategorySchema,
  badge: z.string().max(200).default(""),
  footer: z.string().max(500).default(""),
  deadline: z.string().max(200).nullable().optional(),
  type: extracurricularTypeSchema.nullable().optional(),
  cost: costOptionSchema.nullable().optional(),
  grades: z.array(z.number().int().min(9).max(12)).default([]),
  tags: z.array(z.string().min(1).max(100)).default([]),
  deadlineAt: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .optional(),
  featuredOrder: z.number().int().nullable().optional(),
  trendingOrder: z.number().int().nullable().optional(),
  status: listingStatusSchema.default("draft"),
};

export const createListingBodySchema = z
  .object({
    id: z.string().min(1).max(200),
    ...baseListingFields,
  })
  .strip();

export const updateListingBodySchema = z
  .object({
    title: baseListingFields.title.optional(),
    org: baseListingFields.org.optional(),
    location: baseListingFields.location.optional(),
    region: baseListingFields.region.optional(),
    description: baseListingFields.description.optional(),
    image: baseListingFields.image.optional(),
    category: baseListingFields.category.optional(),
    badge: baseListingFields.badge.optional(),
    footer: baseListingFields.footer.optional(),
    deadline: baseListingFields.deadline,
    type: baseListingFields.type,
    cost: baseListingFields.cost,
    grades: baseListingFields.grades.optional(),
    tags: baseListingFields.tags.optional(),
    deadlineAt: baseListingFields.deadlineAt,
    featuredOrder: baseListingFields.featuredOrder,
    trendingOrder: baseListingFields.trendingOrder,
    status: listingStatusSchema.optional(),
  })
  .strip();

export const orderBodySchema = z.object({
  order: z.number().int().nullable(),
});

export const adminListListingsQuerySchema = z
  .object({
    status: z
      .string()
      .optional()
      .transform((v, ctx) => {
        if (!v || v === "") return undefined;
        const r = listingStatusSchema.safeParse(v);
        if (!r.success) {
          ctx.addIssue({ code: "custom", message: `Invalid status: ${v}` });
          return z.NEVER;
        }
        return r.data;
      }),
    category: z
      .string()
      .optional()
      .transform((v, ctx) => {
        if (!v || v === "") return undefined;
        const r = listingCategorySchema.safeParse(v);
        if (!r.success) {
          ctx.addIssue({ code: "custom", message: `Invalid category: ${v}` });
          return z.NEVER;
        }
        return r.data;
      }),
    q: z.string().optional().transform((v) => v?.trim() || undefined),
    limit: z
      .string()
      .optional()
      .transform((v) => (v === undefined || v === "" ? 50 : Number(v)))
      .refine(
        (n) => Number.isInteger(n) && n >= 1 && n <= 500,
        "limit must be 1-500",
      ),
    offset: z
      .string()
      .optional()
      .transform((v) => (v === undefined || v === "" ? 0 : Number(v)))
      .refine(
        (n) => Number.isInteger(n) && n >= 0,
        "offset must be non-negative",
      ),
  })
  .strip();

export type CreateListingBody = z.output<typeof createListingBodySchema>;
export type UpdateListingBody = z.output<typeof updateListingBodySchema>;
export type AdminListListingsQuery = z.output<typeof adminListListingsQuerySchema>;
