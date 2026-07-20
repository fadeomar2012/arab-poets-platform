import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { getEvents, getPeople } from "@/lib/content";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base =
    process.env.URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const contentByLocale = await Promise.all(
    locales.map(async (locale) => ({
      locale,
      events: await getEvents(locale),
      people: await getPeople(locale),
    })),
  );
  const staticPaths = [
    "",
    "/about",
    "/events",
    "/people",
    "/gallery",
    "/participate",
    "/contact",
    "/privacy",
  ];

  return [
    ...locales.flatMap((locale) =>
      staticPaths.map((path) => ({
        url: `${base}/${locale}${path}`,
        changeFrequency: "weekly" as const,
      })),
    ),
    ...contentByLocale.flatMap(({ locale, events }) =>
      events.map((event) => ({
        url: `${base}/${locale}/events/${event.slug}`,
        changeFrequency: "weekly" as const,
      })),
    ),
    ...contentByLocale.flatMap(({ locale, people }) =>
      people.map((person) => ({
        url: `${base}/${locale}/people/${person.slug}`,
        changeFrequency: "monthly" as const,
      })),
    ),
  ];
}
