import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "../domain/AppError.js";

let client: SupabaseClient | null = null;

/**
 * Service-role Supabase client for server-only operations:
 * - Admin user mutations (deleteAuthUser)
 * - Storage signed-upload URLs
 *
 * NEVER expose the service-role key to browsers.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;

  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) {
    throw new AppError(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured",
      500,
      "SUPABASE_NOT_CONFIGURED",
    );
  }
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
