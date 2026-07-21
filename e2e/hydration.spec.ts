import { test, expect } from "@playwright/test";
import { collectDiagnostics, realConsoleErrors } from "./_helpers";

/**
 * P0: prove the client islands hydrate and are interactive in a real browser.
 * These assertions rely on genuine React state changes, not server HTML.
 */

test("events calendar island hydrates and reacts to input", async ({ page }) => {
  const diag = collectDiagnostics(page);
  await page.goto("/ar/events", { waitUntil: "networkidle" });

  const input = page.locator(".calendar-search input");
  await expect(input).toBeVisible();

  const count = page.locator(".calendar-result-count");
  const initial = (await count.textContent())?.trim();

  // Typing gibberish must reduce matches to zero — proof React is filtering.
  await input.fill("zzz-no-such-event-zzz");
  await expect(count).not.toHaveText(initial ?? "", { timeout: 10_000 });
  await expect(count).toContainText(/^0\b|\b0\s/);

  await input.fill("");
  await expect(count).toHaveText(initial ?? "");

  expect(realConsoleErrors(diag), `console errors:\n${diag.consoleErrors.join("\n")}`).toEqual([]);
  expect(diag.pageErrors, `page errors:\n${diag.pageErrors.join("\n")}`).toEqual([]);
});

test("gallery lightbox island hydrates and opens", async ({ page }) => {
  const diag = collectDiagnostics(page);
  await page.goto("/ar/gallery", { waitUntil: "networkidle" });

  const tiles = page.locator(".gallery-tile");
  const tileCount = await tiles.count();
  test.skip(tileCount === 0, "no gallery items in CMS");

  await tiles.first().click();
  // A lightbox / dialog should appear after a real click.
  const lightbox = page.locator(".lightbox, [role='dialog']");
  await expect(lightbox.first()).toBeVisible({ timeout: 10_000 });

  await page.keyboard.press("Escape");
  await expect(lightbox.first()).toBeHidden({ timeout: 10_000 });

  expect(diag.pageErrors, `page errors:\n${diag.pageErrors.join("\n")}`).toEqual([]);
});

test("header/mobile navigation island hydrates", async ({ page }) => {
  const diag = collectDiagnostics(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/ar", { waitUntil: "networkidle" });

  const toggle = page.locator(".mobile-navigation button").first();
  await expect(toggle).toBeVisible();
  await toggle.click();
  // Some nav surface should become visible after toggling.
  await expect(page.locator(".mobile-navigation a, [role='dialog'] a").first()).toBeVisible({ timeout: 10_000 });

  expect(diag.pageErrors, `page errors:\n${diag.pageErrors.join("\n")}`).toEqual([]);
});
