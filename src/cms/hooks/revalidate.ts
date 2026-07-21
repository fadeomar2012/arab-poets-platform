import { revalidatePath, revalidateTag } from "next/cache";
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from "payload";

const locales = ["ar", "en"] as const;

type PublicArea =
  | "home"
  | "about"
  | "events"
  | "people"
  | "gallery"
  | "contact"
  | "participate";

type RevalidationOptions = {
  areas?: PublicArea[];
  detailArea?: "events" | "people";
  invalidateLayout?: boolean;
  tags?: string[];
};

const areaPath = (locale: (typeof locales)[number], area: PublicArea) =>
  area === "home" ? `/${locale}` : `/${locale}/${area}`;

function safelyRevalidate(path: string, type?: "layout" | "page") {
  try {
    if (type) revalidatePath(path, type);
    else revalidatePath(path);
  } catch (error) {
    // Payload hooks can also run from standalone scripts where Next's cache
    // context is unavailable. Content must still be saved in that scenario.
    console.warn(`[cache] Unable to revalidate ${path}.`, error);
  }
}

function revalidatePublicContent(
  options: RevalidationOptions,
  slug?: string,
) {
  for (const locale of locales) {
    for (const area of options.areas ?? []) {
      safelyRevalidate(areaPath(locale, area));
    }

    if (options.detailArea) {
      if (slug) safelyRevalidate(`/${locale}/${options.detailArea}/${slug}`);
      safelyRevalidate(`/${locale}/${options.detailArea}/[slug]`, "page");
    }

    if (options.invalidateLayout) {
      safelyRevalidate(`/${locale}`, "layout");
    }
  }

  for (const tag of options.tags ?? []) {
    try {
      // Next 16's revalidateTag takes a cache-life profile as its second
      // argument. This is a best-effort on-demand purge of the tagged data
      // cache; correctness is still bounded by the loaders' `revalidate: 300`.
      revalidateTag(tag, "max");
    } catch (error) {
      console.warn(`[cache] Unable to revalidate tag ${tag}.`, error);
    }
  }

  safelyRevalidate("/sitemap.xml");
}

export function collectionRevalidationHooks(options: RevalidationOptions): {
  afterChange: CollectionAfterChangeHook[];
  afterDelete: CollectionAfterDeleteHook[];
} {
  return {
    afterChange: [({ doc, previousDoc }) => {
      const currentSlug = typeof doc?.slug === "string" ? doc.slug : undefined;
      const previousSlug =
        typeof previousDoc?.slug === "string" ? previousDoc.slug : undefined;

      revalidatePublicContent(options, currentSlug);
      if (previousSlug && previousSlug !== currentSlug) {
        revalidatePublicContent(options, previousSlug);
      }

      return doc;
    }],
    afterDelete: [({ doc }) => {
      const slug = typeof doc?.slug === "string" ? doc.slug : undefined;
      revalidatePublicContent(options, slug);
      return doc;
    }],
  };
}

export function globalRevalidationHook(
  options: RevalidationOptions,
): GlobalAfterChangeHook {
  return ({ doc }) => {
    revalidatePublicContent(options);
    return doc;
  };
}
