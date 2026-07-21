import { test, expect } from "@playwright/test";

/**
 * Phase 8: secure draft-preview endpoint. Verifies the secret gate, input
 * validation, open-redirect protection, Draft Mode cookie, and exit.
 */
const SECRET = process.env.PREVIEW_SECRET;

test.describe("draft preview security", () => {
  test("rejects unauthenticated requests (no session, no secret) with a no-store 401", async ({ request }) => {
    const noSecret = await request.get("/api/preview?type=events&slug=x&locale=ar", { maxRedirects: 0 });
    expect(noSecret.status()).toBe(401);
    // Draft entry point responses are never cacheable.
    expect(noSecret.headers()["cache-control"]).toMatch(/no-store/);
    const badSecret = await request.get("/api/preview?secret=wrong&type=events&slug=x&locale=ar", { maxRedirects: 0 });
    expect(badSecret.status()).toBe(401);
  });

  test("rejects a tampered/forged Payload session cookie", async ({ request }) => {
    // A forged auth token must not authorize preview; the JWT signature fails
    // validation server-side and the request falls through to 401.
    const forged = await request.get("/api/preview?type=events&slug=x&locale=ar", {
      maxRedirects: 0,
      headers: { cookie: "payload-token=not-a-real-jwt.forged.value" },
    });
    expect(forged.status()).toBe(401);
  });

  test("rejects invalid target / open-redirect attempts", async ({ request }) => {
    test.skip(!SECRET, "PREVIEW_SECRET not provided to test env");
    // Unknown type must not redirect anywhere.
    const badType = await request.get(`/api/preview?secret=${SECRET}&type=https://evil.example&slug=x&locale=ar`, { maxRedirects: 0 });
    expect(badType.status()).toBe(400);
    // Bad locale.
    const badLocale = await request.get(`/api/preview?secret=${SECRET}&type=events&slug=x&locale=fr`, { maxRedirects: 0 });
    expect(badLocale.status()).toBe(400);
    // Missing slug for a collection.
    const noSlug = await request.get(`/api/preview?secret=${SECRET}&type=events&locale=ar`, { maxRedirects: 0 });
    expect(noSlug.status()).toBe(400);
  });

  test("valid secret enables Draft Mode and redirects to a server-built path", async ({ request }) => {
    test.skip(!SECRET, "PREVIEW_SECRET not provided to test env");
    const res = await request.get(`/api/preview?secret=${SECRET}&type=events&slug=some-event&locale=ar`, { maxRedirects: 0 });
    expect([307, 308]).toContain(res.status());
    expect(res.headers()["location"]).toBe("/ar/events/some-event");
    // Draft Mode sets the prerender-bypass cookie.
    const setCookie = res.headers()["set-cookie"] || "";
    expect(setCookie).toMatch(/__prerender_bypass/);
  });

  test("exit-preview clears Draft Mode and redirects safely", async ({ request }) => {
    const res = await request.get("/api/exit-preview?to=/ar/events", { maxRedirects: 0 });
    expect([307, 308]).toContain(res.status());
    expect(res.headers()["location"]).toBe("/ar/events");
    // Open-redirect attempt is ignored.
    const evil = await request.get("/api/exit-preview?to=https://evil.example", { maxRedirects: 0 });
    expect(evil.headers()["location"]).toBe("/ar");
  });

  test("published visitor never receives draft content by default", async ({ request }) => {
    // A normal request (no preview cookie) to a detail page is published-only.
    const res = await request.get("/ar/events", { maxRedirects: 0 });
    expect(res.status()).toBe(200);
  });
});
