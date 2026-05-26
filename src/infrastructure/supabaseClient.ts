import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "../domain/AppError.js";

let adminClient: SupabaseClient | null = null;
let anonClient: SupabaseClient | null = null;

/**
 * Service-role Supabase client for server-only operations:
 * - Admin user mutations (deleteAuthUser)
 * - Storage signed-upload URLs
 *
 * NEVER expose the service-role key to browsers.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient;

  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) {
    throw new AppError(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured",
      500,
      "SUPABASE_NOT_CONFIGURED",
    );
  }
  adminClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}

/**
 * Public Supabase client for anonymous, read-only calls.
 * Uses the anon key; safe to use on the server.
 */
export function getSupabaseClient(): SupabaseClient {
  if (anonClient) return anonClient;

  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_ANON_KEY"];
  if (!url || !key) {
    throw new AppError(
      "SUPABASE_URL and SUPABASE_ANON_KEY must be configured",
      500,
      "SUPABASE_NOT_CONFIGURED",
    );
  }

  anonClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return anonClient;
}
