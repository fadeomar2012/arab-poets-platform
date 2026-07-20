# Arab Poets Platform — v0.4.0 Cultural UI/UX Refactor

A bilingual Next.js and Payload CMS platform backed by Supabase PostgreSQL, with Cloudinary media storage and Netlify deployment support.

## Current capabilities

- Next.js App Router public website in Arabic RTL and English LTR
- Payload Admin at `/admin`, including Arabic and English admin-interface languages
- Cultural calendar with multi-day event markers, search and filters, selected-day cards, responsive mobile layout, and shareable URL state
- Refined cultural design system for Arabic RTL and English LTR, including typography, spacing, radii, shadows, buttons, cards, skeletons, and motion
- Accessible gallery lightbox with previous/next controls, keyboard navigation, captions, credits, and event context
- Custom editorial Payload dashboard with quick actions, inbox metrics, recent content, and content-health indicators
- CMS-powered header, footer, homepage hero, featured people, association team, statistics, partners, and official contact channels
- Events, people, literary works, partners, media, taxonomies, inboxes, and globals
- Draft and publish workflows with independent Arabic/English publication status and role-based Admin/Editor permissions
- Public content loaded through Payload Local API
- Cached public pages with Payload publish hooks that invalidate affected routes immediately
- Supabase runtime and migration connection separation
- Direct Cloudinary CDN image delivery with bounded transformations and a local-storage fallback when Cloudinary is not configured
- Shared client/server validation, field-level errors, rate limits, and reference IDs for contact and participation forms
- Idempotent bilingual seed data for CMS-to-website testing

## Local setup

```bash
npm ci
cp .env.example .env.local
npm run migrate
npm run seed
npm run dev
```

Open:

- Arabic website: `http://localhost:3000/ar`
- English website: `http://localhost:3000/en`
- Payload Admin: `http://localhost:3000/admin`

Create the first Admin account from `/admin` before testing editorial permissions. On the first Admin request after this update, the interface initializes in Arabic once; later language choices remain under the user’s control.

## Verification commands

```bash
npm run generate:types
npm run lint
npm run typecheck
npm run build
npm run migrate:status
npm run seed
npm run seed:verify
```

Run `npm run seed` twice. The second normal run is read-only for existing versioned fixtures, preventing duplicate records and unnecessary Versions. Then run `npm run seed:verify` to validate per-locale publication status, public visibility, all seed media URLs, and homepage configuration. Set `SEED_UPDATE_EXISTING=true` only when fixture content must intentionally be refreshed.

## CMS strict mode

Staging and production should use:

```env
CMS_STRICT_MODE=true
CMS_ALLOW_MOCK_FALLBACK=false
```

Mock fallback should only be enabled temporarily for local visual work when the CMS database is intentionally unavailable.

## Deployment notes

1. Add all variables from `.env.example` to Netlify.
2. Set `NEXT_PUBLIC_SERVER_URL` and `NEXT_PUBLIC_SITE_URL` to the final HTTPS domain.
3. Run `npm run migrate` against the production database before the first production build and whenever a new migration is added.
4. Keep `PAYLOAD_DB_PUSH=false` outside disposable local databases.
5. Do not run production migrations automatically from every Deploy Preview.

## Security

Never commit or distribute `.env`, `.env.local`, database passwords, `PAYLOAD_SECRET`, or `CLOUDINARY_API_SECRET`. The distributable ZIP should contain `.env.example` only.
