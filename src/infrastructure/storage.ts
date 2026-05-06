import { randomUUID } from "node:crypto";
import { AppError } from "../domain/AppError.js";
import { getSupabaseAdmin } from "./supabaseClient.js";

export type SignedUpload = {
  path: string;
  uploadUrl: string;
  publicUrl: string;
  token: string;
};

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
]);

const EXT_FROM_CT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};

function bucket(): string {
  return process.env["SUPABASE_STORAGE_BUCKET"] ?? "listing-images";
}

function extFor(filename: string, contentType: string): string {
  if (EXT_FROM_CT[contentType]) return EXT_FROM_CT[contentType];
  const m = /\.([a-z0-9]+)$/i.exec(filename);
  return m && m[1] ? m[1].toLowerCase() : "bin";
}

/**
 * Returns a one-shot signed upload URL for the listing-images bucket.
 * Server picks the storage path so clients can't overwrite arbitrary objects.
 */
export async function createListingImageUploadUrl(args: {
  filename: string;
  contentType: string;
}): Promise<SignedUpload> {
  if (!ALLOWED_CONTENT_TYPES.has(args.contentType)) {
    throw new AppError(
      `Unsupported content type: ${args.contentType}`,
      400,
      "UNSUPPORTED_MEDIA_TYPE",
    );
  }

  const supa = getSupabaseAdmin();
  const ext = extFor(args.filename, args.contentType);
  const path = `listings/${new Date().getFullYear()}/${randomUUID()}.${ext}`;

  const { data, error } = await supa.storage
    .from(bucket())
    .createSignedUploadUrl(path);

  if (error || !data) {
    throw new AppError(
      error?.message ?? "Failed to create upload URL",
      500,
      "STORAGE_ERROR",
    );
  }

  const { data: pub } = supa.storage.from(bucket()).getPublicUrl(path);

  return {
    path,
    uploadUrl: data.signedUrl,
    token: data.token,
    publicUrl: pub.publicUrl,
  };
}
