# GitHub and Netlify Deployment

## 1. Create the GitHub repository

Suggested repository name:

```text
arab-poets-platform
```

Keep the repository private while the project is under review.

## 2. Upload the code

From PowerShell or a terminal inside the unzipped project folder:

```bash
git init
git add .
git commit -m "feat: initialize Arab poets platform"
git branch -M main
git remote add origin https://github.com/fadeomar2012/arab-poets-platform.git
git push -u origin main
```

Create the empty repository on GitHub before running the last two commands. Do not add a GitHub README or `.gitignore` when creating it, because the project already contains those files.

## 3. Connect Netlify

1. Open Netlify.
2. Choose **Add new project → Import an existing project**.
3. Select GitHub and authorize the repository.
4. Select `arab-poets-platform`.
5. Build command: `npm run build`.
6. Do not set a manual publish directory; Netlify detects modern Next.js automatically.
7. Deploy.

## 4. Current environment variables

None are required in the mock-content phase. Netlify provides its read-only `URL` variable during the build, and the app uses it for metadata, `robots.txt`, and `sitemap.xml`.

Later, the Payload integration will add:

```text
DATABASE_URI
PAYLOAD_SECRET
NEXT_PUBLIC_SERVER_URL
```

Image storage and email variables will be added only after providers are selected.

## 5. Updating the preview

```bash
git add .
git commit -m "feat: describe the change"
git push
```

Netlify will build and publish the updated commit automatically.

## 6. Pre-push checks

```bash
npm install
npm run typecheck
npm run lint
npm run build
```
