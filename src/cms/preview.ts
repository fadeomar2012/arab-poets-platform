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

export function collectionPreview(segment: "events" | "people"): CollectionPreview {
  return (doc, { locale, req }) => {
    const slug = typeof doc.slug === "string" ? doc.slug : "";
    if (!slug) return null;
    return `${baseURL(req)}/${publicLocale(locale)}/${segment}/${encodeURIComponent(slug)}`;
  };
}

export const homepagePreview: GlobalPreview = (_doc, { locale, req }) =>
  `${baseURL(req)}/${publicLocale(locale)}`;
