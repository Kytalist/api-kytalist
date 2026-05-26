import { Router } from "express";
import { AppError } from "../../domain/AppError.js";
import { getSupabaseClient } from "../../infrastructure/supabaseClient.js";
import { asyncHandler } from "../asyncHandler.js";
import { ok } from "../respond.js";

export function createSupabaseDemoRouter(): Router | null {
  if (process.env["SUPABASE_DEMO_ENABLED"] !== "true") return null;

  const r = Router();

  r.get(
    "/supabase-demo",
    asyncHandler(async (_req, res) => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("listings")
        .select("id,title")
        .limit(5);

      if (error) {
        throw new AppError(error.message, 500, "SUPABASE_ERROR");
      }

      ok(res, { data });
    }),
  );

  return r;
}
