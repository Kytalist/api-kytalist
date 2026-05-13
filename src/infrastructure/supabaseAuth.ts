import { createRemoteJWKSet, jwtVerify } from "jose";
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

let cachedJWKS: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS(): ReturnType<typeof createRemoteJWKSet> {
  if (cachedJWKS) return cachedJWKS;

  const url = process.env["SUPABASE_URL"];
  if (!url) {
    throw new AppError(
      "SUPABASE_URL is not configured",
      500,
      "AUTH_NOT_CONFIGURED",
    );
  }

  cachedJWKS = createRemoteJWKSet(
    new URL(`${url}/auth/v1/.well-known/jwks.json`),
  );
  return cachedJWKS;
}

/** Verify a Supabase access JWT (ES256 via JWKS). Throws AppError(401) on invalid. */
export async function verifyAccessToken(
  token: string,
): Promise<SupabaseJwtPayload> {
  try {
    const JWKS = getJWKS();
    const { payload } = await jwtVerify(token, JWKS);
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
