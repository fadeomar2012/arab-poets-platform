import { test, expect } from "@playwright/test";

/**
 * Phase 9: internal-link crawl + dead/placeholder link detection for both
 * locales, including generated event and person detail pages.
 */
const SEED_PAGES = ["/ar", "/ar/about", "/ar/events", "/ar/people", "/ar/gallery", "/ar/contact", "/ar/participate", "/ar/privacy", "/en", "/en/about", "/en/events", "/en/people", "/en/gallery", "/en/contact", "/en/participate", "/en/privacy"];

test("no placeholder or dead anchors in rendered pages", async ({ page, request, baseURL }) => {
  test.setTimeout(180_000);
  const origin = new URL(baseURL!).origin;
  const badAnchors: string[] = [];
  const internalTargets = new Set<string>();

  // Also crawl one generated event + person detail page.
  const pages = [...SEED_PAGES];
  await page.goto("/ar/events", { waitUntil: "networkidle" });
  const eventHref = await page.locator("a[href*='/ar/events/']").first().getAttribute("href");
  if (eventHref) pages.push(eventHref);
  await page.goto("/ar/people", { waitUntil: "networkidle" });
  const personHref = await page.locator("a[href*='/ar/people/']").first().getAttribute("href");
  if (personHref) pages.push(personHref);

  for (const path of pages) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const anchors = await page.locator("a[href]").evaluateAll((els) =>
      els.map((el) => (el as HTMLAnchorElement).getAttribute("href") || ""),
    );
    for (const href of anchors) {
      // Forbidden placeholders / dead patterns.
      if (
        href === "#" ||
        href.startsWith("javascript:") ||
        /example\.(org|com|net)/i.test(href) ||
        /970000000000/.test(href) ||
        href.trim() === ""
      ) {
        badAnchors.push(`${path} → ${href}`);
      }
      // Collect internal targets for reachability check.
      if (href.startsWith("/")) internalTargets.add(href.split("#")[0]);
      else if (href.startsWith(origin)) internalTargets.add(new URL(href).pathname);
    }
  }

  expect(badAnchors, `placeholder/dead anchors found:\n${badAnchors.join("\n")}`).toEqual([]);

  // Every internal link must resolve (200/3xx), not 404/500.
  const broken: string[] = [];
  for (const target of internalTargets) {
    if (target.startsWith("/api")) continue;
    const res = await request.get(target, { maxRedirects: 0 });
    const status = res.status();
    if (status >= 400) broken.push(`${target} → ${status}`);
  }
  expect(broken, `broken internal links:\n${broken.join("\n")}`).toEqual([]);
});
