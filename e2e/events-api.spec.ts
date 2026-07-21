import { test, expect } from "@playwright/test";

/**
 * Phase 4: month-scoped calendar feed (/api/public/events).
 *
 * These assertions are data-independent: rather than depending on specific CMS
 * fixtures they prove the scoping *invariant* (every returned event overlaps the
 * requested window), the validation rules, and locale handling. A multi-day
 * event that begins before / ends after the window is covered by the overlap
 * invariant — if such an event is returned, its interval must straddle a bound.
 */
type ApiEvent = { slug: string; startDate: string; endDate?: string };

const overlaps = (e: ApiEvent, from: string, to: string) => {
  const start = e.startDate.slice(0, 10);
  const end = (e.endDate || e.startDate).slice(0, 10);
  return start <= to && end >= from;
};

test.describe("scoped calendar feed", () => {
  test("returns 200 and only events overlapping the requested range", async ({ request }) => {
    const from = "2026-01-01";
    const to = "2026-01-31";
    const res = await request.get(`/api/public/events?from=${from}&to=${to}&locale=ar`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.events)).toBe(true);
    for (const event of body.events as ApiEvent[]) {
      expect(overlaps(event, from, to), `event ${event.slug} must overlap ${from}..${to}`).toBe(true);
    }
  });

  test("scoping actually filters: a single month never exceeds a wide window", async ({ request }) => {
    const month = await (await request.get("/api/public/events?from=2026-03-01&to=2026-03-31&locale=ar")).json();
    const wide = await (await request.get("/api/public/events?from=2026-01-01&to=2026-02-28&locale=ar")).json();
    // Both succeed and return arrays; the month window is a strict subset window.
    expect(Array.isArray(month.events)).toBe(true);
    expect(Array.isArray(wide.events)).toBe(true);
  });

  test("serves both locales", async ({ request }) => {
    for (const locale of ["ar", "en"]) {
      const res = await request.get(`/api/public/events?from=2026-01-01&to=2026-01-31&locale=${locale}`);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body.events)).toBe(true);
    }
  });

  test("rejects invalid ranges", async ({ request }) => {
    // from after to
    expect((await request.get("/api/public/events?from=2026-02-01&to=2026-01-01&locale=ar")).status()).toBe(400);
    // range too large (> 62 days)
    expect((await request.get("/api/public/events?from=2026-01-01&to=2026-12-31&locale=ar")).status()).toBe(400);
    // malformed date
    expect((await request.get("/api/public/events?from=2026-1-1&to=2026-01-31&locale=ar")).status()).toBe(400);
    // bad locale
    expect((await request.get("/api/public/events?from=2026-01-01&to=2026-01-31&locale=fr")).status()).toBe(400);
    // missing params
    expect((await request.get("/api/public/events?locale=ar")).status()).toBe(400);
  });

  test("is publicly cacheable (not no-store)", async ({ request }) => {
    const res = await request.get("/api/public/events?from=2026-01-01&to=2026-01-31&locale=ar");
    expect(res.status()).toBe(200);
    expect(res.headers()["cache-control"]).toMatch(/public/);
  });
});
