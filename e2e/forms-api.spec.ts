import { test, expect, type APIRequestContext } from "@playwright/test";

/**
 * Phase 3: Contact & Participation API behavior against the real Payload DB.
 * Valid submissions are tagged with E2E_TOKEN so scripts/e2e-db.mjs can remove
 * exactly (and only) the records this run created.
 */
const TOKEN = process.env.E2E_TOKEN || `E2E-RUN-${Date.now()}`;
// Each logical group uses a distinct forwarded IP so in-memory rate-limit
// buckets never bleed between tests.
const ip = (n: string) => ({ "x-forwarded-for": `10.9.${n}` });

async function post(request: APIRequestContext, path: string, body: unknown, headers: Record<string, string> = {}) {
  return request.post(path, { data: body, headers: { "content-type": "application/json", ...headers } });
}

test.describe("contact API", () => {
  test("valid submission creates a record and returns a reference", async ({ request }) => {
    const res = await post(request, "/api/public/contact", {
      name: `${TOKEN} Contact`,
      email: `e2e+contact.${TOKEN}@test.invalid`,
      phoneOrWhatsapp: "+900000000000",
      message: `${TOKEN} valid contact message long enough to pass.`,
      consent: true,
    }, ip("1.1"));
    expect(res.status()).toBe(201);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.reference).toMatch(/^CM-/);
  });

  test("invalid submission returns 400 with field errors and no reference", async ({ request }) => {
    const res = await post(request, "/api/public/contact", {
      name: "x", // too short
      email: "not-an-email",
      message: "short", // < 10
      consent: false, // missing consent
    }, ip("1.2"));
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBe("invalid");
    expect(json.fieldErrors).toBeTruthy();
    expect(json.reference).toBeUndefined();
    // No internal stack trace leaked.
    expect(JSON.stringify(json)).not.toMatch(/at\s+\w+.*\(|node_modules|\.ts:\d+/);
  });

  test("honeypot submission is accepted but creates no record", async ({ request }) => {
    const res = await post(request, "/api/public/contact", {
      name: `${TOKEN} Honeypot`,
      email: `e2e+honey.${TOKEN}@test.invalid`,
      message: `${TOKEN} honeypot should not be stored at all here.`,
      consent: true,
      website: "http://spam.example", // honeypot filled
    }, ip("1.3"));
    expect(res.status()).toBe(201);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.reference).toBeUndefined(); // no record → no reference
  });

  test("malformed JSON returns 400", async ({ request }) => {
    const res = await request.post("/api/public/contact", {
      headers: { "content-type": "application/json", ...ip("1.4") },
      // Buffer avoids the client re-serializing a string body as JSON.
      data: Buffer.from("{ this is : not json", "utf8"),
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toBe("invalid_json");
  });

  test("oversized field is rejected", async ({ request }) => {
    const res = await post(request, "/api/public/contact", {
      name: `${TOKEN} Oversized`,
      email: `e2e+big.${TOKEN}@test.invalid`,
      message: "x".repeat(6000), // exceeds max 5000
      consent: true,
    }, ip("1.5"));
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toBe("invalid");
  });

  test("rate limiting kicks in after the limit", async ({ request }) => {
    const headers = ip("2.1");
    let sawRateLimit = false;
    for (let i = 0; i < 8; i++) {
      const res = await post(request, "/api/public/contact", {
        name: `${TOKEN} Rate ${i}`,
        email: `e2e+rate.${i}.${TOKEN}@test.invalid`,
        message: `${TOKEN} rate limit probe number ${i} padded out.`,
        consent: true,
      }, headers);
      if (res.status() === 429) { sawRateLimit = true; break; }
    }
    expect(sawRateLimit).toBe(true);
  });
});

test.describe("participation API", () => {
  test("valid submission with event slug creates a record", async ({ request }) => {
    const res = await post(request, "/api/public/participation", {
      fullName: `${TOKEN} Participant`,
      email: `e2e+part.${TOKEN}@test.invalid`,
      country: "Testland",
      whatsapp: "+900123456789",
      participationType: "poet",
      externalUrl: "https://example.com/portfolio",
      shortBio: `${TOKEN} short bio text.`,
      message: `${TOKEN} participation notes.`,
      consent: true,
    }, ip("3.1"));
    expect(res.status()).toBe(201);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.reference).toMatch(/^PR-/);
  });

  test("invalid URL and short whatsapp are rejected", async ({ request }) => {
    const res = await post(request, "/api/public/participation", {
      fullName: `${TOKEN} BadPart`,
      email: `e2e+badpart.${TOKEN}@test.invalid`,
      country: "Testland",
      whatsapp: "12", // too short
      participationType: "poet",
      externalUrl: "not a url",
      consent: true,
    }, ip("3.2"));
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("invalid");
    expect(json.reference).toBeUndefined();
  });

  test("missing consent is rejected", async ({ request }) => {
    const res = await post(request, "/api/public/participation", {
      fullName: `${TOKEN} NoConsent`,
      email: `e2e+noconsent.${TOKEN}@test.invalid`,
      country: "Testland",
      whatsapp: "+900123456789",
      participationType: "writer",
      consent: false,
    }, ip("3.3"));
    expect(res.status()).toBe(400);
    expect((await res.json()).reference).toBeUndefined();
  });
});
