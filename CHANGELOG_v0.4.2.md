# Changelog — v0.4.2 (Closure Sprint)

Release date: 2026-07-21
Supersedes: v0.4.1

This release closes the remaining verified gaps from v0.4.1: real month-scoped
calendar loading, correct browser history semantics, detail-route query
tightening, authenticated draft-preview hardening, the invisible mobile menu
icon, and a clean, inspected release package.

## Fixes

- **Mobile header icon visibility** — `.icon-button` now sets an explicit dark
  foreground (`--navy-900`) and the icon SVG inherits it (`color: inherit`).
  Previously the button had a white background but inherited the header's white
  text, so the menu/close glyph was white-on-white and invisible on mobile.
  Hover (`--gold-700`), active, and focus-visible states are covered; the
  44×44 touch target and accessible name are retained. Verified in AR and EN at
  320/360/390px (computed fg/bg separation = 648, was 0).

## Performance

- **Person detail no longer scans the full events archive.** It previously
  loaded every event (`getEvents`) just to filter a poet's appearances client
  of the render. It now issues a targeted `getEventsBySlugs(person.eventSlugs)`
  query that fetches only the relevant events with lightweight card projections.
- Detail routes keep on-demand ISR (`revalidate = 300`); repeated warm requests
  are served from the Next data/route cache rather than re-querying every time.

## Calendar

- **Intentional history semantics.** Discrete navigation — month change, day
  selection (click), country/city/type/status filter, reset — now uses
  `pushState`, so browser Back/Forward restores the exact previous month,
  selected day, filters, and URL. Search typing, initial URL normalization, and
  `popstate` restoration use `replaceState`, so no history entry is created per
  keystroke and the restored URL is never clobbered. Equivalent-state writes are
  de-duplicated.
- **Month/range-scoped loading (no more 200-event client archive).** The events
  page seeds only the events near "now" plus filter facets; the calendar fetches
  each newly visible grid range from a scoped public endpoint on demand. Rapid
  month switches abort stale requests (`AbortController`); a scoped loading state
  and a retryable error state replace blank/failed panels.

## CMS

- Event create/update/delete/publish now also purges the calendar data cache via
  a tagged invalidation (`events-calendar`), in addition to the existing path
  revalidation. Correctness is bounded by the loaders' `revalidate: 300`.

## Preview

- **Draft preview is hardened with editor authentication.** `/api/preview` now
  validates an authenticated Payload editor session as the primary gate;
  `PREVIEW_SECRET` remains only as a secondary, non-interactive fallback and is
  **no longer embedded in the CMS-generated preview links** (it will not leak
  into browser history, logs, or the admin UI). All preview responses are
  `Cache-Control: no-store`. Resource type, locale, and slug are validated
  server-side; the redirect destination is always a server-built relative path
  (no open redirect).

## Accessibility

- Calendar grid roles/selection and the AR/EN axe suites continue to pass with
  no serious/critical violations. The mobile icon fix restores a visible,
  WCAG-contrasting control with a visible focus ring.

## Testing

- New/strengthened Playwright coverage (real Chromium):
  - `events-api.spec.ts` — scoped feed overlap invariant, validation (bad range,
    >62-day window, malformed date, bad locale, missing params), both locales,
    public cacheability.
  - `calendar.spec.ts` — exact Back/Forward restoration of month + filter + URL;
    month navigation issues a scoped `/api/public/events?from&to&locale` request.
  - `responsive.spec.ts` — mobile menu icon fg/bg separation at 320/360/390 in
    AR and EN, closed and open states, touch-target size.
  - `preview.spec.ts` — unauthenticated + tampered-cookie rejection with
    no-store, open-redirect rejection, valid-secret redirect, exit.
- Full run: **58 tests passed, 0 failed** (calendar, events-api, preview,
  responsive, hydration, forms-api, forms-ui, links, accessibility).
- E2E inbox records created by form tests were cleaned up and verified (0 remain).

## Release packaging

- `scripts/package-release.mjs` builds the distributable from an **explicit
  allowlist**, never by zipping the repo. It stages files, creates the ZIP,
  **inspects the finished archive and fails on any forbidden path/extension**,
  computes the SHA-256 of the ZIP itself, and writes a manifest.
- `.gitignore` now also excludes `/release/`, `*.zip`, `*.sha256`, and local
  editor state. The stale unclean `src_updated.zip` and the misdirected
  `V0.4.1_FINAL_STATUS.md.sha256` (a checksum of a document, not a ZIP) were
  removed.

## Environment variables

- No new required variables. `PREVIEW_SECRET` is now optional/secondary rather
  than the sole preview gate; authenticated editors do not need it in URLs.

## Migration impact

- **None.** No schema change; no new migration. The four existing migrations
  remain applied (`migrate:status` shows 4/4). No data was reset or deleted.
