import { test, expect } from "@playwright/test";
import { collectDiagnostics } from "./_helpers";

const TOKEN = process.env.E2E_TOKEN || `E2E-UI-${Date.now()}`;

test.describe("contact form UX", () => {
  test("invalid submit shows inline errors and focuses the first invalid field", async ({ page }) => {
    await page.goto("/ar/contact", { waitUntil: "networkidle" });
    await page.locator("form.form-card button[type=submit]").click();

    // At least one inline field error appears.
    await expect(page.locator(".field-error").first()).toBeVisible();
    // Still on the contact page (no navigation, no crash).
    await expect(page).toHaveURL(/\/ar\/contact/);
    // The first invalid field (name) receives focus.
    const focusedName = await page.evaluate(() => (document.activeElement as HTMLInputElement)?.name);
    expect(focusedName).toBe("name");
    // No success message rendered.
    await expect(page.locator(".success-message")).toHaveCount(0);
  });

  test("email and phone fields are LTR inside the RTL form", async ({ page }) => {
    await page.goto("/ar/contact", { waitUntil: "networkidle" });
    await expect(page.locator("input[name=email]")).toHaveAttribute("dir", "ltr");
    await expect(page.locator("input[name=phoneOrWhatsapp]")).toHaveAttribute("dir", "ltr");
  });

  test("valid submit shows success + reference; submit disables during send", async ({ page }) => {
    const diag = collectDiagnostics(page);
    await page.goto("/ar/contact", { waitUntil: "networkidle" });
    await page.fill("input[name=name]", `${TOKEN} UI Contact`);
    await page.fill("input[name=email]", `e2e+ui.${TOKEN}@test.invalid`);
    await page.fill("textarea[name=message]", `${TOKEN} a valid message of sufficient length.`);
    await page.check("input[name=consent]");

    const submit = page.locator("form.form-card button[type=submit]");
    await submit.click();
    await expect(page.locator(".success-message")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".success-message")).toContainText(/CM-/);
    expect(diag.pageErrors, diag.pageErrors.join("\n")).toEqual([]);
  });
});

test.describe("participation form", () => {
  test("preselects the event when opened from an event detail link", async ({ page }) => {
    // Discover a real event slug from the events page.
    await page.goto("/ar/events", { waitUntil: "networkidle" });
    const href = await page.locator("a[href*='/ar/events/']").first().getAttribute("href");
    const slug = href?.split("/").pop();
    test.skip(!slug, "no event to preselect");

    await page.goto(`/ar/participate?event=${slug}`, { waitUntil: "networkidle" });
    await expect(page.locator(".selected-event")).toBeVisible();
    await expect(page.locator("input[name=requestedEventSlug]")).toHaveValue(slug!);
  });
});

test.describe("responsive: no horizontal overflow", () => {
  for (const width of [320, 360, 390]) {
    test(`contact & participate fit at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      for (const path of ["/ar/contact", "/ar/participate", "/en/contact"]) {
        await page.goto(path, { waitUntil: "networkidle" });
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `${path} @ ${width}px overflow`).toBeLessThanOrEqual(1);
      }
    });
  }
});
