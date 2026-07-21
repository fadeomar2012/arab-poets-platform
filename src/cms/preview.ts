import type { CollectionConfig, GlobalConfig } from "payload";

type CollectionPreview = NonNullable<NonNullable<CollectionConfig["admin"]>["preview"]>;
type GlobalPreview = NonNullable<NonNullable<GlobalConfig["admin"]>["preview"]>;

function baseURL(req: Parameters<CollectionPreview>[1]["req"]): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_SERVER_URL ||
    req.payload.config.serverURL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function publicLocale(locale: string): "ar" | "en" {
  return locale === "en" ? "en" : "ar";
}

// Builds a link into the secured Draft Mode entry point. The editor reaches it
// while authenticated in the admin, so /api/preview validates their Payload
// session cookie — no PREVIEW_SECRET is placed in the URL (it must not leak into
// browser history, access logs, or the admin UI). The endpoint itself enables
// Draft Mode only after authorization and renders the unpublished version.
function previewURL(
  req: Parameters<CollectionPreview>[1]["req"],
  type: "events" | "people" | "homepage",
  locale: string,
  slug?: string,
): string {
  const base = baseURL(req);
  const params = new URLSearchParams({ type, locale: publicLocale(locale) });
  if (slug) params.set("slug", slug);
  return `${base}/api/preview?${params.toString()}`;
}

export function collectionPreview(segment: "events" | "people"): CollectionPreview {
  return (doc, { locale, req }) => {
    const slug = typeof doc.slug === "string" ? doc.slug : "";
    if (!slug) return null;
    return previewURL(req, segment, locale, slug);
  };
}

export const homepagePreview: GlobalPreview = (_doc, { locale, req }) =>
  previewURL(req, "homepage", locale);
