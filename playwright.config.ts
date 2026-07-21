import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config. The base URL is provided via PLAYWRIGHT_BASE_URL so the same
 * suite can run against a production server (npm run build && npm run start)
 * or the dev server (npm run dev). Servers are started outside Playwright to
 * keep control over dev-vs-prod and port selection.
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: "e2e/results/results.json" }]],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    // Disable entrance animations so assertions (and axe contrast checks) run
    // against the stable, fully-opaque final state rather than mid-fade frames.
    reducedMotion: "reduce",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 15_000,
  },
  projects: [
    // Use the full Chromium build (new headless) instead of the separate
    // headless-shell download.
    { name: "chromium", use: { ...devices["Desktop Chrome"], channel: "chromium" } },
  ],
});
