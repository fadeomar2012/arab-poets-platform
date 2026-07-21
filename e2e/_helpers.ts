import type { Page } from "@playwright/test";

export type PageDiagnostics = {
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
};

/**
 * Attaches listeners that record client-side console errors, uncaught page
 * errors, and failed network requests. React hydration failures surface here.
 */
export function collectDiagnostics(page: Page): PageDiagnostics {
  const diag: PageDiagnostics = { consoleErrors: [], pageErrors: [], failedRequests: [] };
  page.on("console", (msg) => {
    if (msg.type() === "error") diag.consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => diag.pageErrors.push(err.message));
  page.on("requestfailed", (req) => {
    const url = req.url();
    // Ignore benign favicon / devtools noise.
    if (url.includes("favicon") || url.includes("__nextjs")) return;
    diag.failedRequests.push(`${req.method()} ${url} — ${req.failure()?.errorText}`);
  });
  return diag;
}

const BENIGN = [
  "Download the React DevTools",
];

/** Filter out known-benign console noise so real errors stand out. */
export function realConsoleErrors(diag: PageDiagnostics): string[] {
  return diag.consoleErrors.filter((t) => !BENIGN.some((b) => t.includes(b)));
}

export function timestampTag(prefix: string): string {
  // Date.now is fine inside Playwright (Node), not a workflow script.
  return `${prefix}-${Date.now()}`;
}
