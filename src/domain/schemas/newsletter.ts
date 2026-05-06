import { z } from "zod";

export const subscribeBodySchema = z
  .object({
    email: z.string().email(),
  })
  .strip();

export const confirmQuerySchema = z
  .object({
    token: z.string().min(1),
  })
  .strip();

export const adminListSubscribersQuerySchema = z
  .object({
    status: z
      .string()
      .optional()
      .transform((v) => (v && v !== "" ? v : undefined)),
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

export const broadcastBodySchema = z
  .object({
    subject: z.string().min(1).max(500),
    html: z.string().min(1),
  })
  .strip();

export type SubscribeBody = z.output<typeof subscribeBodySchema>;
export type ConfirmQuery = z.output<typeof confirmQuerySchema>;
export type AdminListSubscribersQuery = z.output<
  typeof adminListSubscribersQuerySchema
>;
export type BroadcastBody = z.output<typeof broadcastBodySchema>;
