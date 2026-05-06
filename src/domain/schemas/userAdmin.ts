import { z } from "zod";

export const userRoleSchema = z.enum(["user", "admin"]);

export const adminListUsersQuerySchema = z
  .object({
    role: z
      .string()
      .optional()
      .transform((v, ctx) => {
        if (!v || v === "") return undefined;
        const r = userRoleSchema.safeParse(v);
        if (!r.success) {
          ctx.addIssue({ code: "custom", message: `Invalid role: ${v}` });
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

export const updateUserBodySchema = z
  .object({
    role: userRoleSchema.optional(),
  })
  .strip();

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export type AdminListUsersQuery = z.output<typeof adminListUsersQuerySchema>;
export type UpdateUserBody = z.output<typeof updateUserBodySchema>;
