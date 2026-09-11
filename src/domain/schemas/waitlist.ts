import { z } from "zod";

export const waitlistBodySchema = z
  .object({
    email: z.string().email(),
  })
  .strip();

export type WaitlistBody = z.output<typeof waitlistBodySchema>;
