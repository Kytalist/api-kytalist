import { z } from "zod";

export const listingCategorySchema = z.enum(["activity", "camp", "internship"]);

export const extracurricularTypeSchema = z.enum([
  "Competition",
  "Research",
  "Program",
  "Club",
  "Volunteer",
  "Leadership",
  "Arts",
  "STEM",
]);

export const costOptionSchema = z.enum(["Free", "Paid", "Stipend"]);

export const listingsSortSchema = z.enum(["deadline", "alpha", "recent"]);

const optStr = z.string().optional();

export const listListingsQuerySchema = z
  .object({
    category: optStr.transform((v, ctx) => {
      if (!v || v === "" || v === "all") return "all" as const;
      const r = listingCategorySchema.safeParse(v);
      if (!r.success) {
        ctx.addIssue({ code: "custom", message: `Invalid category: ${v}` });
        return z.NEVER;
      }
      return r.data;
    }),

    region: optStr.transform((v) => {
      if (!v || v === "" || v === "All regions") return undefined;
      return v;
    }),

    type: optStr.transform((v, ctx) => {
      if (!v || v === "" || v === "All") return undefined;
      const r = extracurricularTypeSchema.safeParse(v);
      if (!r.success) {
        ctx.addIssue({ code: "custom", message: `Invalid type: ${v}` });
        return z.NEVER;
      }
      return r.data;
    }),

    cost: optStr.transform((v, ctx) => {
      if (!v || v === "" || v === "Any cost") return undefined;
      const r = costOptionSchema.safeParse(v);
      if (!r.success) {
        ctx.addIssue({ code: "custom", message: `Invalid cost: ${v}` });
        return z.NEVER;
      }
      return r.data;
    }),

    grade: optStr.transform((v, ctx) => {
      if (v === undefined || v === "") return undefined;
      const n = Number(v);
      if (!Number.isInteger(n) || n < 9 || n > 12) {
        ctx.addIssue({ code: "custom", message: `Invalid grade: ${v}` });
        return z.NEVER;
      }
      return n;
    }),

    q: optStr.transform((v) => {
      const t = v?.trim();
      return t && t !== "" ? t : undefined;
    }),

    sort: optStr.transform((v, ctx) => {
      if (!v || v === "") return "deadline" as const;
      const r = listingsSortSchema.safeParse(v);
      if (!r.success) {
        ctx.addIssue({ code: "custom", message: `Invalid sort: ${v}` });
        return z.NEVER;
      }
      return r.data;
    }),

    limit: optStr.transform((v, ctx) => {
      if (v === undefined || v === "") return 100;
      const n = Number(v);
      if (!Number.isInteger(n) || n < 1 || n > 500) {
        ctx.addIssue({ code: "custom", message: "limit must be 1-500" });
        return z.NEVER;
      }
      return n;
    }),

    offset: optStr.transform((v, ctx) => {
      if (v === undefined || v === "") return 0;
      const n = Number(v);
      if (!Number.isInteger(n) || n < 0) {
        ctx.addIssue({
          code: "custom",
          message: "offset must be non-negative",
        });
        return z.NEVER;
      }
      return n;
    }),
  })
  .strip();

export type ListListingsQueryParsed = z.output<typeof listListingsQuerySchema>;

export const listingIdParamsSchema = z.object({
  id: z.string().min(1, "id is required"),
});
