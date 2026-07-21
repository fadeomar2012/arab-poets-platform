import config from "@payload-config";
import { getPayload } from "payload";
import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { timingSafeEqual } from "node:crypto";

/**
 * Secure draft-preview entry point (Next.js Draft Mode).
 *
 * Authorization is defence-in-depth:
 *   1. Primary — an authenticated Payload editor session. The admin preview
 *      action opens this endpoint same-origin while the editor is logged in, so
 *      the `payload-token` cookie is sent and validated here. This is the path
 *      the CMS actually uses and it exposes no secret in the URL.
 *   2. Secondary — a matching PREVIEW_SECRET, for non-interactive/automated use
 *      only. It is NEVER embedded in the CMS-generated preview links
 *      (see src/cms/preview.ts), so it does not leak into browser history,
 *      access logs, or the admin UI during normal editing.
 *
 * The redirect destination is built server-side from a validated
 * collection/global + slug + locale, so this endpoint cannot be used as an
 * open redirect. Draft Mode is only enabled after authorization succeeds;
 * published visitors never reach the draft render path.
 */
const LOCALES = new Set(["ar", "en"]);
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,159}$/;
const NO_STORE = { "Cache-Control": "no-store" } as const;

function secretMatches(provided: string | null): boolean {
  const expected = process.env.PREVIEW_SECRET;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// Validates the incoming Payload auth cookie/token and confirms an active
// editor from the admin users collection. overrideAccess is never used as the
// sole authorization mechanism — this gate runs first.
async function isAuthenticatedEditor(request: Request): Promise<boolean> {
  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: request.headers });
    return Boolean(user && user.collection === "users");
  } catch {
    return false;
  }
}

function buildDestination(type: string, locale: string, slug: string | null): string | null {
  switch (type) {
    case "events":
      return slug && SLUG_RE.test(slug) ? `/${locale}/events/${slug}` : null;
    case "people":
      return slug && SLUG_RE.test(slug) ? `/${locale}/people/${slug}` : null;
    case "homepage":
    case "site-settings":
      return `/${locale}`;
    default:
      return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const authorized =
    (await isAuthenticatedEditor(request)) || secretMatches(searchParams.get("secret"));
  if (!authorized) {
    return new Response("Unauthorized preview request", { status: 401, headers: NO_STORE });
  }

  const type = searchParams.get("type") ?? "";
  const locale = searchParams.get("locale") ?? "ar";
  const slug = searchParams.get("slug");

  if (!LOCALES.has(locale)) {
    return new Response("Invalid locale", { status: 400, headers: NO_STORE });
  }

  const destination = buildDestination(type, locale, slug);
  if (!destination) {
    return new Response("Invalid preview target", { status: 400, headers: NO_STORE });
  }

  const draft = await draftMode();
  draft.enable();

  // `destination` is always a server-built relative path — no open redirect.
  redirect(destination);
}
