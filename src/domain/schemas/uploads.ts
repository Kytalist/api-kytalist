import { z } from "zod";

export const imageUploadBodySchema = z
  .object({
    filename: z.string().min(1).max(500),
    contentType: z.string().min(1).max(100),
  })
  .strip();

export type ImageUploadBody = z.output<typeof imageUploadBodySchema>;
