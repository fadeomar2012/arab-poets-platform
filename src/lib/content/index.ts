import { cache } from "react";
import type { Locale } from "@/i18n/config";
import { events, people } from "./mock-data";
import {
  loadEventBySlug,
  loadEvents,
  loadHomepageSettings,
  loadPeople,
  loadPersonBySlug,
  loadSiteSettings,
  payloadReady,
} from "./payload";
import type { Event, HomepageSettings, Person, SiteSettings } from "./types";


const cachedLoadEvents = cache(loadEvents);
const cachedLoadEventBySlug = cache(loadEventBySlug);
const cachedLoadPeople = cache(loadPeople);
const cachedLoadPersonBySlug = cache(loadPersonBySlug);
const cachedLoadSiteSettings = cache(loadSiteSettings);
const cachedLoadHomepageSettings = cache(loadHomepageSettings);

let warned = false;

const allowMockFallback = () =>
  process.env.CMS_ALLOW_MOCK_FALLBACK === "true" ||
  (process.env.NODE_ENV !== "production" && process.env.CMS_STRICT_MODE !== "true");

const handleFailure = (error: unknown): void => {
  if (!warned) {
    warned = true;
    console.error("Payload content is unavailable.", error);
  }
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
): Promise<Event | null> {
  if (payloadReady()) {
    try {
      return await cachedLoadEventBySlug(slug, locale);
    } catch (error) {
      handleFailure(error);
    }
  } else if (!allowMockFallback()) {
    throw new Error("Payload is not configured and mock fallback is disabled.");
  }
  return structuredClone(events.find((event) => event.slug === slug) ?? null);
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
): Promise<Person | null> {
  if (payloadReady()) {
    try {
      return await cachedLoadPersonBySlug(slug, locale);
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
): Promise<HomepageSettings | null> {
  if (!payloadReady()) return null;
  try {
    return await cachedLoadHomepageSettings(locale);
  } catch (error) {
    handleFailure(error);
    return null;
  }
}
