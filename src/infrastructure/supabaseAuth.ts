import { jwtVerify } from "jose";
import { AppError } from "../domain/AppError.js";

export type SupabaseJwtPayload = {
  sub: string;
  email?: string;
  aud?: string | string[];
  role?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
  exp?: number;
};

let cachedSecret: Uint8Array | null = null;

function getSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  const raw = process.env["SUPABASE_JWT_SECRET"];
  if (!raw) {
    throw new AppError(
      "SUPABASE_JWT_SECRET is not configured",
      500,
      "AUTH_NOT_CONFIGURED",
    );
  }
  cachedSecret = new TextEncoder().encode(raw);
  return cachedSecret;
}

/** Verify a Supabase access JWT (HS256). Throws AppError(401) on invalid. */
export async function verifyAccessToken(
  token: string,
): Promise<SupabaseJwtPayload> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    if (typeof payload.sub !== "string") {
      throw new AppError("Token missing subject", 401, "INVALID_TOKEN");
    }
    return payload as unknown as SupabaseJwtPayload;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      err instanceof Error ? err.message : "Invalid token",
      401,
      "INVALID_TOKEN",
    );
  }
}
