import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Phase 9: automated accessibility scan (axe-core) on key pages, both locales.
 * Fails on serious/critical WCAG violations.
 */
const PAGES = ["/ar", "/ar/about", "/ar/events", "/ar/people", "/ar/gallery", "/ar/contact", "/ar/participate", "/en", "/en/events", "/en/contact"];

for (const path of PAGES) {
  test(`axe: ${path} has no serious/critical violations`, async ({ page }) => {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    // Let the one-shot .reveal entrance animation (0.55s) settle so axe measures
    // the final opaque state, not a mid-fade frame.
    await page.waitForTimeout(800);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    const summary = serious
      .map((v) => `[${v.impact}] ${v.id}: ${v.nodes.length} node(s) — ${v.help}\n    ${v.nodes.map((n) => n.target.join(" ")).join("\n    ")}`)
      .join("\n");
    expect(serious, `serious/critical a11y violations on ${path}:\n${summary}`).toEqual([]);
  });
}

test("calendar grid exposes correct roles and selection", async ({ page }) => {
  await page.goto("/ar/events", { waitUntil: "domcontentloaded" });
  await expect(page.locator("[role='grid']")).toBeVisible();
  const selected = page.locator(".calendar-day[aria-selected='true']");
  await expect(selected).toHaveCount(1);
  // Day cells carry descriptive accessible names (not color-only markers).
  const label = await page.locator(".calendar-day.has-events").first().getAttribute("aria-label");
  expect(label && label.length).toBeGreaterThan(5);
});
