import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { Locale } from "@/i18n/config";
import { events, people } from "./mock-data";
import {
  loadEventBySlug,
  loadEvents,
  loadEventFacets,
  loadEventsInRange,
  loadEventsBySlugs,
  loadGalleryItems,
  loadHomepageSettings,
  loadPeople,
  loadPartnersBySlugs,
  loadPersonBySlug,
  loadSiteSettings,
  payloadReady,
} from "./payload";
import type { Event, GalleryItem, HomepageSettings, Partner, Person, SiteSettings } from "./types";
import { EVENTS_CALENDAR_TAG } from "./tags";


const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Walks the error cause chain looking for transient Postgres/pooler connection
// failures. These are recoverable (Supabase occasionally drops or refuses a
// pooled connection under concurrent load, e.g. during a build's prerender
// burst), unlike a genuine SQL/schema error which will fail deterministically.
const isTransientDbError = (error: unknown): boolean => {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current; depth++) {
    if (current instanceof AggregateError) return true;
    const name = (current as { name?: string })?.name ?? "";
    const message = (current as { message?: string })?.message ?? "";
    if (name === "AggregateError") return true;
    if (/Connection terminated|terminated unexpectedly|ECONNRESET|ETIMEDOUT|connection timeout|Connection ended|timeout expired|too many clients|Client has encountered a connection error/i.test(message)) {
      return true;
    }
    current = (current as { cause?: unknown })?.cause;
  }
  return false;
};

// Retries a loader on transient connection errors with short backoff so a
// flaky pooled connection does not fail a page render or the whole build.
function withRetry<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  attempts = 3,
): (...args: Args) => Promise<Result> {
  return async (...args: Args): Promise<Result> => {
    let lastError: unknown;
    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
        if (attempt === attempts - 1 || !isTransientDbError(error)) throw error;
        await sleep(300 * (attempt + 1));
      }
    }
    throw lastError;
  };
}

const cachedLoadEvents = cache(withRetry(loadEvents));
const cachedLoadEventsBySlugs = cache(withRetry(loadEventsBySlugs));
const cachedLoadEventBySlug = cache(withRetry(loadEventBySlug));
const cachedLoadPeople = cache(withRetry(loadPeople));
const cachedLoadPersonBySlug = cache(withRetry(loadPersonBySlug));
const cachedLoadSiteSettings = cache(withRetry(loadSiteSettings));
const cachedLoadHomepageSettings = cache(withRetry(loadHomepageSettings));
const cachedLoadPartnersBySlugs = cache(withRetry(loadPartnersBySlugs));
const cachedLoadGalleryItems = cache(withRetry(loadGalleryItems));

// Mock content is used ONLY when explicitly opted in (intentional local visual
// development without a database). A *configured* database that then fails at
// query time must never silently downgrade to mock content — the real error is
// surfaced so it cannot masquerade as working content in dev or production.
const allowMockFallback = () => process.env.CMS_ALLOW_MOCK_FALLBACK === "true";

const handleFailure = (error: unknown): void => {
  console.error("Payload content is unavailable.", error);
  if (!allowMockFallback()) throw error;
};

export async function getEvents(locale: Locale = "ar"): Promise<Event[]> {
  if (payloadReady()) {
    try {
      return await cachedLoadEvents(locale);
    } catch (error) {
      handleFailure(error);
    }
  } else if (!allowMockFallback()) {
    throw new Error("Payload is not configured and mock fallback is disabled.");
  }
  return structuredClone(events);
}

export async function getEventBySlug(
  slug: string,
  locale: Locale = "ar",
  draft = false,
): Promise<Event | null> {
  if (payloadReady()) {
    try {
      return await cachedLoadEventBySlug(slug, locale, draft);
    } catch (error) {
      handleFailure(error);
    }
  } else if (!allowMockFallback()) {
    throw new Error("Payload is not configured and mock fallback is disabled.");
  }
  return structuredClone(events.find((event) => event.slug === slug) ?? null);
}

// Public, published-only, tagged cache for month-scoped calendar queries. Keyed
// by locale + range so each visible window is cached independently and shared
// across visitors. Draft Mode never reaches here (the public endpoint refuses
// preview), so drafts cannot leak into this cache.
export async function getEventsInRange(
  from: string,
  to: string,
  locale: Locale = "ar",
): Promise<Event[]> {
  if (payloadReady()) {
    try {
      const cached = unstable_cache(
        () => withRetry(loadEventsInRange)(from, to, locale),
        ["events-in-range", locale, from, to],
        { tags: [EVENTS_CALENDAR_TAG], revalidate: 300 },
      );
      return await cached();
    } catch (error) {
      handleFailure(error);
    }
  } else if (!allowMockFallback()) {
    throw new Error("Payload is not configured and mock fallback is disabled.");
  }
  return structuredClone(
    events.filter((event) => {
      const start = event.startDate.slice(0, 10);
      const end = (event.endDate || event.startDate).slice(0, 10);
      return start <= to && end >= from;
    }),
  );
}

export async function getEventFacets(locale: Locale = "ar") {
  if (payloadReady()) {
    try {
      const cached = unstable_cache(
        () => withRetry(loadEventFacets)(locale),
        ["event-facets", locale],
        { tags: [EVENTS_CALENDAR_TAG], revalidate: 300 },
      );
      return await cached();
    } catch (error) {
      handleFailure(error);
    }
  } else if (!allowMockFallback()) {
    throw new Error("Payload is not configured and mock fallback is disabled.");
  }
  // Mock facets derived from fixture events.
  const countries = [...new Set(events.map((e) => e.country.ar))].sort();
  const cities = [...new Map(events.map((e) => [`${e.country.ar}::${e.city.ar}`, { country: e.country.ar, city: e.city.ar }])).values()];
  const types = [...new Map(events.map((e) => [e.typeSlug || e.type.ar, { key: e.typeSlug || e.type.ar, label: e.type.ar, color: e.typeColor, showInLegend: e.typeShowInLegend !== false }])).values()];
  return { countries, cities, types };
}

export async function getEventsBySlugs(
  slugs: string[],
  locale: Locale = "ar",
): Promise<Event[]> {
  if (!slugs.length) return [];
  if (payloadReady()) {
    try {
      return await cachedLoadEventsBySlugs(slugs, locale);
    } catch (error) {
      handleFailure(error);
    }
  } else if (!allowMockFallback()) {
    throw new Error("Payload is not configured and mock fallback is disabled.");
  }
  return structuredClone(events.filter((event) => slugs.includes(event.slug)));
}

export async function getPeople(locale: Locale = "ar"): Promise<Person[]> {
  if (payloadReady()) {
    try {
      return (await cachedLoadPeople(locale)).filter((person) => person.visible);
    } catch (error) {
      handleFailure(error);
    }
  } else if (!allowMockFallback()) {
    throw new Error("Payload is not configured and mock fallback is disabled.");
  }
  return structuredClone(people.filter((person) => person.visible));
}

export async function getPersonBySlug(
  slug: string,
  locale: Locale = "ar",
  draft = false,
): Promise<Person | null> {
  if (payloadReady()) {
    try {
      return await cachedLoadPersonBySlug(slug, locale, draft);
    } catch (error) {
      handleFailure(error);
    }
  } else if (!allowMockFallback()) {
    throw new Error("Payload is not configured and mock fallback is disabled.");
  }
  return structuredClone(
    people.find((person) => person.slug === slug && person.visible) ?? null,
  );
}

export async function getPeopleBySlugs(
  slugs: string[],
  locale: Locale = "ar",
): Promise<Person[]> {
  if (!slugs.length) return [];
  if (payloadReady()) {
    try {
      return (await cachedLoadPeople(locale, slugs)).filter((person) => person.visible);
    } catch (error) {
      handleFailure(error);
    }
  } else if (!allowMockFallback()) {
    throw new Error("Payload is not configured and mock fallback is disabled.");
  }
  return structuredClone(
    people.filter((person) => person.visible && slugs.includes(person.slug)),
  );
}


export async function getGalleryItems(locale: Locale = "ar"): Promise<GalleryItem[]> {
  if (payloadReady()) {
    try {
      return await cachedLoadGalleryItems(locale);
    } catch (error) {
      handleFailure(error);
    }
  } else if (!allowMockFallback()) {
    throw new Error("Payload is not configured and mock fallback is disabled.");
  }
  return structuredClone(
    events.flatMap((event) =>
      event.gallery.map((image) => ({
        ...image,
        eventSlug: event.slug,
        eventTitle: event.title,
        eventDate: event.startDate,
        eventLocation: event.city,
      })),
    ),
  );
}

export async function getSiteSettings(
  locale: Locale = "ar",
): Promise<SiteSettings | null> {
  if (!payloadReady()) return null;
  try {
    return await cachedLoadSiteSettings(locale);
  } catch (error) {
    handleFailure(error);
    return null;
  }
}

export async function getHomepageSettings(
  locale: Locale = "ar",
  draft = false,
): Promise<HomepageSettings | null> {
  if (!payloadReady()) return null;
  try {
    return await cachedLoadHomepageSettings(locale, draft);
  } catch (error) {
    handleFailure(error);
    return null;
  }
}


export async function getPartnersBySlugs(
  slugs: string[],
  locale: Locale = "ar",
): Promise<Partner[]> {
  if (!slugs.length || !payloadReady()) return [];
  try {
    return await cachedLoadPartnersBySlugs(slugs, locale);
  } catch (error) {
    handleFailure(error);
    return [];
  }
}
