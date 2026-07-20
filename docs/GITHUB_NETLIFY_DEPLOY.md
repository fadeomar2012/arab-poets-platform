# GitHub and Netlify Deployment — v0.2

## 1. Install and verify locally

```bash
npm install
npm run migrate:create -- initial
npm run migrate
npm run dev
```

Open `/admin`, create the first user, upload one image, and publish one event before deploying.

## 2. Commit to GitHub

```bash
git add .
git commit -m "feat: integrate Payload, Supabase, and Cloudinary"
git push
```

The generated `package-lock.json` and migration files should be committed. `.env.local` must remain untracked.

## 3. Netlify environment variables

Add these in **Site configuration → Environment variables**:

```text
DATABASE_URL
DATABASE_MIGRATION_URL
PAYLOAD_SECRET
NEXT_PUBLIC_SERVER_URL
NEXT_PUBLIC_SITE_URL
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
CLOUDINARY_FOLDER
PAYLOAD_DB_PUSH=false
```

Set both public URL variables to the final HTTPS Netlify URL, for example:

```text
https://your-site-name.netlify.app
```

## 4. Database migration

Apply migrations from your trusted local environment before deploying:

```bash
npm run migrate:status
npm run migrate
```

The migration wrapper uses `DATABASE_MIGRATION_URL`. The deployed runtime uses `DATABASE_URL`.

## 5. Connect Netlify

1. Import the GitHub repository.
2. Build command: `npm run build`.
3. Do not set a static publish directory.
4. Deploy.
5. Open `https://your-site.netlify.app/admin`.

## 6. Production smoke test

- Admin login works.
- Published Event appears publicly.
- Cloudinary upload works.
- Contact form creates an Inbox record.
- Participation form creates an Inbox record.
- Arabic and English pages load.
- Drafts are not visible to anonymous users.
