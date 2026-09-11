import { AppError } from "../domain/AppError.js";

const CLIST_BASE = "https://clist.by/api/v4/contest/";

export type ClistContest = {
  id: number;
  event: string;
  href: string;
  resource: string;
  resource_id: number;
  host: string;
  /** Naive UTC timestamp, e.g. "2026-09-12T14:35:00". */
  start: string;
  /** Naive UTC timestamp, or null. */
  end: string | null;
  duration: number | null;
};

type ClistResponse = {
  objects?: ClistContest[];
};

export async function fetchClistContests(params: {
  resourceId: number;
  limit?: number;
  startGt?: Date;
  startLt?: Date;
  timeoutMs?: number;
}): Promise<ClistContest[]> {
  const username = process.env["CLIST_USERNAME"];
  const apiKey = process.env["CLIST_API_KEY"];
  if (!username || !apiKey) {
    throw new AppError(
      "CLIST_USERNAME / CLIST_API_KEY are not configured",
      500,
      "CLIST_NOT_CONFIGURED",
    );
  }

  const url = new URL(CLIST_BASE);
  url.searchParams.set("username", username);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("upcoming", "true");
  url.searchParams.set("resource_id", String(params.resourceId));
  url.searchParams.set("limit", String(params.limit ?? 100));
  url.searchParams.set("order_by", "start");
  url.searchParams.set(
    "start__gt",
    (params.startGt ?? new Date()).toISOString(),
  );
  if (params.startLt) {
    url.searchParams.set("start__lt", params.startLt.toISOString());
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    params.timeoutMs ?? 15_000,
  );

  try {
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new AppError(
        `clist.by request failed: ${res.status} ${body.slice(0, 200)}`,
        502,
        "CLIST_ERROR",
      );
    }
    const data = (await res.json()) as ClistResponse;
    return data.objects ?? [];
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * clist.by returns naive datetimes that are UTC. `new Date()` would interpret
 * those in the host timezone, so force UTC by appending `Z`.
 */
export function parseClistDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const normalized = /[zZ]|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}
