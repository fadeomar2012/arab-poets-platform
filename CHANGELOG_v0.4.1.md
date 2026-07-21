# Changelog — v0.4.1

Arab Poets Platform. Builds on the v0.4.0 UI/UX refactor. All changes verified
with `npm run build`, `tsc`, ESLint, and a real-browser Playwright suite (50
tests, headless Chromium) against a production server.

## Database

- Applied the pending migration `20260720_164131_ui_ux_refactor` (additive only:
  `homepage_statistics*` tables + `event_types.calendar_color` /
  `show_in_calendar_legend`). No destructive operations; all existing data
  preserved. `npm run migrate:status` reports 4/4 applied.
- **Connection stability.** Raised the Postgres pool (`max` 3 → 8, configurable
  via `DATABASE_POOL_MAX`), added a generous `connectionTimeoutMillis` (30s,
  configurable via `DATABASE_CONNECT_TIMEOUT_MS`), `idleTimeoutMillis` (60s) and
  TCP `keepAlive`. The old `max: 3` serialized the homepage's parallel queries
  and hung concurrent dynamic routes.
- **Automatic retry** of transient pooler failures (connection reset/terminated,
  `AggregateError`, timeouts) with backoff in the content layer, so a flaky
  Supabase connection no longer fails a page render or the build.
- **No silent mock downgrade.** A *configured* database that fails at query time
  now surfaces the real error instead of quietly serving mock content. Mock
  content is used only with explicit opt-in (`CMS_USE_MOCK_CONTENT` /
  `CMS_ALLOW_MOCK_FALLBACK`). Removed the implicit dev fallback.
- Added `npm run doctor` (`scripts/doctor.mjs`): checks env presence (no secrets
  printed), DB connectivity, required schema objects, and migration count.
- Added `npm run smoke` (`scripts/smoke.mjs`): sequential + concurrent request
  stress check that fails on any non-200 or RSC failure.

## Client hydration (P0)

- Proven via real headless Chromium (not curl/HTML) that all client islands
  hydrate and are interactive: the event calendar reacts to typing/clicks, the
  gallery lightbox opens/closes, and mobile navigation toggles. The earlier
  "non-hydration" signal was an in-app preview-browser artifact.

## Terminal warnings (from v0.4.0, retained)

- Custom Cloudinary image loader applied per-image via `SmartImage` (local
  `/images/*` use the default pipeline) — no more `missing-loader-width`.
- `data-scroll-behavior="smooth"` on `<html>`.
- Payload email adapter (`@payloadcms/email-nodemailer`): real SMTP when
  configured, console/stream transport otherwise — no "No email adapter" warning.

## Event calendar (Phase 6)

- Added a **city filter** (scoped to the selected country), a visible **result
  count** (`role="status"`), **roving keyboard navigation** (arrows RTL-aware,
  Home/End/PageUp/PageDown), a **mobile collapsible filter panel**, and
  **back/forward** state restoration via `popstate`.
- **Accessibility:** proper `grid > row > gridcell` structure (weeks wrapped in
  `role="row"` with `display:contents`), `aria-selected` on days, and day
  `aria-label`s that name event types (not colour-only). Legend kept visible on
  mobile; 44px minimum touch targets.
- URL persists month, selected date, and all filters (shareable links).

## Forms (Phase 3)

- Contact & Participation verified against the real Payload DB: valid
  submissions create exactly one record and return a reference; invalid,
  honeypot, malformed-JSON, oversized, and missing-consent submissions create
  none; rate limiting engages; inline localized errors focus the first invalid
  field; email/phone/URL stay LTR inside the RTL form; no overflow at 320px.
- Event preselection from an event detail link persists the requested event.
- Added `scripts/e2e-db.mjs` (`npm run e2e:cleanup`) to remove only E2E-tagged
  test records — never real submissions.

## Content / links (Phase 9)

- **Placeholder & dead-link removal.** Content-layer sanitizer treats
  `example.org/com/net`, all-zero / long-zero-run phone numbers, and
  `test.invalid` as absent, so seed placeholders (`info@example.org`,
  `+970000000000`, `example.org` social/website links) never render as real
  links. Footer/contact fall back to an intentional empty state.
- Internal-link crawler (both locales + generated detail pages) passes with no
  `#`, `javascript:`, placeholder, or broken (4xx/5xx) internal links.

## Accessibility (Phase 9)

- axe-core (WCAG 2 A/AA) passes with no serious/critical violations on all key
  pages, both locales.
- Fixed genuine contrast issues: darkened `--muted` (#667480 → #5f6c77) and
  `--gold-700` (#9d711d → #8a6417) to clear the 4.5:1 threshold on ivory.
- Added accessible names to the People filter search/select.

## Draft & live preview (Phase 8)

- Secure **Draft Mode** via `/api/preview`, gated by `PREVIEW_SECRET`
  (constant-time compare). Redirect destinations are built server-side from a
  validated collection/global + locale + slug — no open redirect. `draft: true`
  reads happen only inside enabled Draft Mode; published visitors never receive
  drafts.
- `/api/exit-preview` disables Draft Mode and only honours safe relative paths.
- Payload admin preview links now route editors through the secured endpoint.
- Events, People, and Homepage support preview. Static generation of public
  pages is **preserved** (homepage and list pages remain SSG).

## Testing infrastructure

- Playwright (`@playwright/test`) + `@axe-core/playwright`. 50 E2E tests:
  hydration (3), calendar (6), preview (5), accessibility (11), links (1),
  responsive (8), forms-api (9), forms-ui (7). Run with `npm run test:e2e`
  (set `PLAYWRIGHT_BASE_URL`, and `PREVIEW_SECRET` for preview tests).

## Migration instructions

```
npm ci
npm run migrate        # applies 20260720_164131_ui_ux_refactor if pending
npm run doctor         # verify env + schema
npm run build && npm run start
```

## Environment additions (see .env.example)

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`,
  `SMTP_FROM_ADDRESS`, `SMTP_FROM_NAME`
- `PREVIEW_SECRET`
- `DATABASE_POOL_MAX`, `DATABASE_CONNECT_TIMEOUT_MS`
- `CMS_USE_MOCK_CONTENT`, `CMS_ALLOW_MOCK_FALLBACK` (replaces `CMS_STRICT_MODE`)

## Dependencies added

- `@payloadcms/email-nodemailer@3.86.0`
- dev: `@playwright/test`, `@axe-core/playwright`, `axe-core`
