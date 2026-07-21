import { test, expect } from "@playwright/test";
import { collectDiagnostics } from "./_helpers";

/** Phase 6: full event-calendar interaction coverage in a real browser. */

test.describe("event calendar (Arabic)", () => {
  test("search, day selection, URL state, month nav", async ({ page }) => {
    const diag = collectDiagnostics(page);
    await page.goto("/ar/events", { waitUntil: "networkidle" });

    const count = page.locator(".calendar-result-count");
    await expect(count).toBeVisible();
    const initialText = (await count.textContent()) ?? "";
    const initialNum = parseInt(initialText, 10);
    expect(initialNum).toBeGreaterThan(0);

    // Clicking a day that has events selects it and populates the day panel.
    const eventDay = page.locator(".calendar-day.has-events").first();
    await eventDay.click();
    await expect(eventDay).toHaveClass(/selected/);
    // URL captures month + date.
    await expect(page).toHaveURL(/month=\d{4}-\d{2}/);
    await expect(page).toHaveURL(/date=\d{4}-\d{2}-\d{2}/);
    // Day panel shows at least one event card.
    await expect(page.locator(".day-events-list .calendar-event-card").first()).toBeVisible();

    // Month navigation changes the header label and URL month.
    const monthLabel = await page.locator(".calendar-header h2").textContent();
    await page.locator(".calendar-next").click();
    await expect(page.locator(".calendar-header h2")).not.toHaveText(monthLabel ?? "");
    const urlAfterNext = page.url();
    await page.locator(".calendar-header .icon-button").first().click();
    await expect(page.locator(".calendar-header h2")).toHaveText(monthLabel ?? "");
    expect(page.url()).not.toEqual(urlAfterNext);

    expect(diag.pageErrors, diag.pageErrors.join("\n")).toEqual([]);
  });

  test("search reduces then restores result count", async ({ page }) => {
    await page.goto("/ar/events", { waitUntil: "networkidle" });
    const count = page.locator(".calendar-result-count");
    const initial = (await count.textContent()) ?? "";
    await page.locator(".calendar-search input").fill("zzz-none-zzz");
    await expect(count).toContainText(/(^|\s)0(\s|$)/);
    await page.locator(".calendar-search input").fill("");
    await expect(count).toHaveText(initial);
  });

  test("country and city filters cooperate; reset clears them", async ({ page }) => {
    await page.goto("/ar/events", { waitUntil: "networkidle" });
    const country = page.locator('.calendar-filters select[aria-label="الدولة"]');
    const city = page.locator('.calendar-filters select[aria-label="المدينة"]');
    const options = await country.locator("option").allTextContents();
    test.skip(options.length < 2, "no country data to filter");

    await country.selectOption({ index: 1 });
    await expect(page).toHaveURL(/country=/);
    // City options are constrained to the chosen country (at least the "all" option remains).
    await expect(city).toBeEnabled();

    const reset = page.locator(".calendar-filters button", { hasText: /إعادة الضبط/ });
    await expect(reset).toBeVisible();
    await reset.click();
    await expect(reset).toBeHidden();
    await expect(country).toHaveValue("all");
  });

  test("browser back/forward restores exact month, filter, and URL state", async ({ page }) => {
    await page.goto("/ar/events", { waitUntil: "networkidle" });
    const monthHeading = page.locator(".calendar-header h2");
    const statusSelect = page.locator('.calendar-filters select[aria-label="الحالة"]');

    // State 0: baseline.
    const url0 = page.url();
    const month0 = (await monthHeading.textContent())?.trim() ?? "";
    await expect(statusSelect).toHaveValue("all");

    // State 1: apply the status filter (discrete → pushState).
    await statusSelect.selectOption("upcoming");
    await expect(page).toHaveURL(/status=upcoming/);
    const url1 = page.url();
    expect(url1).not.toEqual(url0);

    // State 2: advance a month (discrete → pushState). Month heading changes,
    // status filter is retained.
    await page.locator(".calendar-next").click();
    await expect(monthHeading).not.toHaveText(month0);
    await expect(statusSelect).toHaveValue("upcoming");
    const url2 = page.url();
    const month2 = (await monthHeading.textContent())?.trim() ?? "";
    expect(url2).not.toEqual(url1);

    // Back → State 1: previous month restored, filter still upcoming.
    await page.goBack();
    await expect(page).toHaveURL(url1);
    await expect(monthHeading).toHaveText(month0);
    await expect(statusSelect).toHaveValue("upcoming");

    // Back → State 0: filter cleared, baseline URL.
    await page.goBack();
    await expect(page).toHaveURL(url0);
    await expect(statusSelect).toHaveValue("all");
    await expect(monthHeading).toHaveText(month0);

    // Forward → State 1.
    await page.goForward();
    await expect(page).toHaveURL(url1);
    await expect(statusSelect).toHaveValue("upcoming");
    await expect(monthHeading).toHaveText(month0);

    // Forward → State 2: later month reapplied.
    await page.goForward();
    await expect(page).toHaveURL(url2);
    await expect(monthHeading).toHaveText(month2);
    await expect(statusSelect).toHaveValue("upcoming");
  });

  test("navigating months issues a scoped range request (no full archive)", async ({ page }) => {
    await page.goto("/ar/events", { waitUntil: "networkidle" });
    const requestPromise = page.waitForRequest((req) =>
      req.url().includes("/api/public/events") && /[?&]from=\d{4}-\d{2}-\d{2}/.test(req.url()) && /[?&]to=\d{4}-\d{2}-\d{2}/.test(req.url()),
    );
    await page.locator(".calendar-next").click();
    const request = await requestPromise;
    // The request is scoped to a single visible grid window, never an open-ended
    // "give me everything" query.
    expect(request.url()).toMatch(/from=\d{4}-\d{2}-\d{2}&to=\d{4}-\d{2}-\d{2}/);
    expect(request.url()).toMatch(/locale=ar/);
  });

  test("keyboard navigation moves the selected day", async ({ page }) => {
    await page.goto("/ar/events", { waitUntil: "networkidle" });
    const selected = page.locator(".calendar-day.selected");
    await selected.focus();
    const before = (await selected.textContent())?.trim();
    // ArrowLeft in RTL moves forward one day (+1).
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator(".calendar-day.selected")).not.toHaveText(before ?? "");
    // Down a week then up a week returns near start; just assert it changes and no crash.
    await page.keyboard.press("ArrowDown");
    await expect(page.locator(".calendar-grid")).toBeVisible();
  });
});

test.describe("event calendar (English direction)", () => {
  test("renders LTR and interacts", async ({ page }) => {
    await page.goto("/en/events", { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    const count = page.locator(".calendar-result-count");
    await expect(count).toContainText(/matching event/);
    const day = page.locator(".calendar-day.has-events").first();
    await day.click();
    await expect(day).toHaveClass(/selected/);
  });
});
