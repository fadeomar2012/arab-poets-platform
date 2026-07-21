import { NextResponse } from "next/server";
import { getEventsInRange } from "@/lib/content";
import { isLocale } from "@/i18n/config";

/**
 * Public, published-only calendar feed scoped to a visible date range.
 *
 * GET /api/public/events?from=YYYY-MM-DD&to=YYYY-MM-DD&locale=ar|en
 *
 * Returns lightweight event summaries whose interval overlaps [from, to]. It is
 * never a draft path — Draft Mode content is served only through /api/preview —
 * so responses are safe to cache publicly and are tagged for invalidation on
 * any event change (see EVENTS_CALENDAR_TAG).
 */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 62; // A rendered month grid spans at most 6 weeks (42 days).

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const localeParam = searchParams.get("locale") ?? "ar";

  if (!isLocale(localeParam)) return badRequest("Invalid locale.");
  if (!DATE_RE.test(from) || !DATE_RE.test(to)) return badRequest("from and to must be YYYY-MM-DD.");

  const fromMs = Date.parse(`${from}T00:00:00Z`);
  const toMs = Date.parse(`${to}T00:00:00Z`);
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs)) return badRequest("Invalid date.");
  if (fromMs > toMs) return badRequest("from must not be after to.");
  const spanDays = (toMs - fromMs) / 86_400_000;
  if (spanDays > MAX_RANGE_DAYS) return badRequest(`Range too large (max ${MAX_RANGE_DAYS} days).`);

  try {
    const events = await getEventsInRange(from, to, localeParam);
    return NextResponse.json(
      { events },
      {
        headers: {
          // Shared cache; invalidated by tag on event changes. Short client TTL
          // with SWR keeps rapid month navigation snappy without going stale.
          "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to load events." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
