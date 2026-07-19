# International Association of Arab Poets — Next.js MVP

A real Next.js App Router codebase based on the approved UI/UX direction. The first phase uses typed mock content so it can be deployed to a free Netlify URL immediately. Payload CMS, PostgreSQL, persistent uploads, and transactional email are intentionally deferred.

## What is implemented

- Arabic and English routes: `/ar` and `/en`
- RTL/LTR layouts
- Responsive homepage
- Events archive with client-side search and filters
- Dynamic event details
- People directory and profile pages
- About, gallery, participation, contact, and privacy pages
- Mock form success states
- Dynamic metadata, sitemap, robots, loading and error states
- A content adapter that is designed to be replaced by Payload later

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The root redirects to `/ar`.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Deploy to Netlify

1. Create a GitHub repository.
2. Upload this project to the repository root.
3. In Netlify choose **Add new project → Import an existing project**.
4. Select the repository.
5. Netlify detects Next.js automatically.
6. Build command: `npm run build`.
7. Publish directory: leave Netlify's Next.js default; do not set a static folder.

## Payload integration later

See [`docs/PAYLOAD_INTEGRATION.md`](docs/PAYLOAD_INTEGRATION.md). Public pages only call `src/lib/content`, so the mock adapter can be replaced without rewriting the UI pages.

## Important

The forms currently simulate success in the browser. They do not store data or send email until the backend integration phase.
