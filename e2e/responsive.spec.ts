import { test, expect } from "@playwright/test";

/**
 * Phase 5: no horizontal overflow across the full viewport matrix, plus
 * screenshots for visual-regression review.
 */
const WIDTHS = [320, 360, 390, 768, 1024, 1440];
const PAGES = [
  "/ar", "/ar/about", "/ar/events", "/ar/people", "/ar/gallery", "/ar/contact", "/ar/participate", "/ar/privacy",
  "/en", "/en/about", "/en/events",
];

for (const width of WIDTHS) {
  test(`no horizontal overflow @ ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const overflows: string[] = [];
    for (const path of PAGES) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      const diff = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      if (diff > 1) overflows.push(`${path} overflow ${diff}px`);
    }
    expect(overflows, overflows.join("\n")).toEqual([]);
  });
}

// Detail pages included separately (need a discovered slug).
test("detail pages have no overflow at mobile & desktop", async ({ page }) => {
  await page.goto("/ar/events", { waitUntil: "domcontentloaded" });
  const eventHref = await page.locator("a[href*='/ar/events/']").first().getAttribute("href");
  await page.goto("/ar/people", { waitUntil: "domcontentloaded" });
  const personHref = await page.locator("a[href*='/ar/people/']").first().getAttribute("href");
  const targets = [eventHref, personHref].filter(Boolean) as string[];

  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of targets) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      const diff = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(diff, `${path} @ ${width}px`).toBeLessThanOrEqual(1);
    }
  }
});

// Phase 2: the mobile menu icon must never be white-on-white (the icon inherits
// currentColor; the button has a white background). Assert the computed
// foreground and background are not effectively identical, in both locales and
// in both the closed (menu) and open (close) states.
test("mobile menu icon is clearly visible, not white-on-white", async ({ page }) => {
  const rgb = (value: string) => (value.match(/\d+(\.\d+)?/g) || []).map(Number);
  const separation = (fg: number[], bg: number[]) =>
    Math.abs(fg[0] - bg[0]) + Math.abs(fg[1] - bg[1]) + Math.abs(fg[2] - bg[2]);

  for (const width of [320, 360, 390]) {
    await page.setViewportSize({ width, height: 800 });
    for (const path of ["/ar", "/en"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      const button = page.locator(".mobile-menu-button");
      await expect(button).toBeVisible();
      await expect(button).toHaveAttribute("aria-label", /.+/);

      const box = await button.boundingBox();
      expect(box!.width, "touch target width").toBeGreaterThanOrEqual(40);
      expect(box!.height, "touch target height").toBeGreaterThanOrEqual(40);

      const closed = await button.evaluate((el) => {
        const svg = el.querySelector("svg")!;
        return { bg: getComputedStyle(el).backgroundColor, fg: getComputedStyle(svg).color };
      });
      expect(
        separation(rgb(closed.fg), rgb(closed.bg)),
        `menu icon ${closed.fg} on ${closed.bg} @ ${width}px ${path}`,
      ).toBeGreaterThan(120);

      await button.click();
      await expect(page.locator(".mobile-menu-panel")).toBeVisible();
      const open = await button.evaluate((el) => {
        const svg = el.querySelector("svg")!;
        return { bg: getComputedStyle(el).backgroundColor, fg: getComputedStyle(svg).color };
      });
      expect(
        separation(rgb(open.fg), rgb(open.bg)),
        `close icon ${open.fg} on ${open.bg} @ ${width}px ${path}`,
      ).toBeGreaterThan(120);
    }
  }
});

test("capture screenshots for key pages", async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/ar", "/ar/events", "/ar/about", "/en"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      const name = `${path.replace(/\//g, "_") || "_root"}-${width}.png`;
      await page.screenshot({ path: `e2e/results/screens/${name}`, fullPage: true });
    }
  }
});
