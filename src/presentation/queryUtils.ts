import type { ParsedQs } from "qs";

/** Normalize Express `req.query` values to a single string. */
export function queryString(
  val: string | ParsedQs | (string | ParsedQs)[] | undefined,
): string | undefined {
  if (val === undefined) return undefined;
  if (typeof val === "string") return val;
  if (Array.isArray(val)) return queryString(val[0]);
  return undefined;
}

export function paramString(
  val: string | string[] | undefined,
): string | undefined {
  if (val === undefined) return undefined;
  if (typeof val === "string") return val;
  if (Array.isArray(val) && typeof val[0] === "string") return val[0];
  return undefined;
}
