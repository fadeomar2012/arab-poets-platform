import { readFile, access } from "node:fs/promises";
import path from "node:path";
import type {
  EventsFile,
  FacebookDataset,
  LiteraryWorksFile,
  MediaManifest,
  PeopleFile,
  SiteSettingsFile,
  TaxonomiesFile,
} from "./types";

const PERSON_ROLES = new Set([
  "poet",
  "writer",
  "critic",
  "artist",
  "media",
  "presenter",
  "guest",
  "boardMember",
  "teamMember",
  "judge",
  "honoree",
]);

const readJSON = async <T>(dir: string, file: string): Promise<T> =>
  JSON.parse(await readFile(path.join(dir, file), "utf8")) as T;

const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

export const loadDataset = async (dataDir: string): Promise<FacebookDataset> => {
  const [taxonomies, media, people, events, literaryWorks, siteSettings] = await Promise.all([
    readJSON<TaxonomiesFile>(dataDir, "taxonomies.json"),
    readJSON<MediaManifest>(dataDir, "media-manifest.json"),
    readJSON<PeopleFile>(dataDir, "people.json"),
    readJSON<EventsFile>(dataDir, "events.json"),
    readJSON<LiteraryWorksFile>(dataDir, "literary-works.json"),
    readJSON<SiteSettingsFile>(dataDir, "site-settings.json"),
  ]);

  return {
    taxonomies,
    media,
    people,
    events,
    literaryWorks,
    siteSettings,
    version: media.version || taxonomies.version || "unknown",
  };
};

/**
 * Fatal preflight validation of the dataset against the referenced binaries and
 * internal referential integrity. Anything returned here blocks the write run.
 */
export const validateDataset = async (
  dataset: FacebookDataset,
  packageRoot: string,
): Promise<{ errors: string[]; warnings: string[] }> => {
  const errors: string[] = [];
  const warnings: string[] = [];

  const dup = (values: string[], label: string) => {
    const seen = new Set<string>();
    for (const value of values) {
      if (seen.has(value)) errors.push(`Duplicate ${label}: ${value}`);
      seen.add(value);
    }
  };

  const countrySlugs = new Set(dataset.taxonomies.countries.map((c) => c.slug));
  const citySlugs = new Set(dataset.taxonomies.cities.map((c) => c.slug));
  const mediaKeys = new Set(dataset.media.records.map((m) => m.key));
  const peopleSlugs = new Set(dataset.people.records.map((p) => p.slug));
  const eventTypeSlugs = new Set(dataset.taxonomies.eventTypes.map((t) => t.slug));

  dup(dataset.taxonomies.countries.map((c) => c.slug), "country slug");
  dup(dataset.taxonomies.cities.map((c) => c.slug), "city slug");
  dup(dataset.media.records.map((m) => m.key), "media key");
  dup(dataset.people.records.map((p) => p.slug), "person slug");
  dup(dataset.events.records.map((e) => e.slug), "event slug");
  dup(dataset.literaryWorks.records.map((w) => w.slug), "literary-work slug");

  // City -> country referential integrity within the dataset.
  for (const city of dataset.taxonomies.cities) {
    if (!countrySlugs.has(city.countrySlug)) {
      errors.push(`City ${city.slug} references unknown country ${city.countrySlug}`);
    }
  }

  // Media binaries must exist and referenced media keys must resolve.
  for (const record of dataset.media.records) {
    if (!(await fileExists(path.join(packageRoot, record.filePath)))) {
      errors.push(`Missing media file: ${record.filePath}`);
    }
    if (record.derivedFromAssetKey && !mediaKeys.has(record.derivedFromAssetKey)) {
      errors.push(`Media ${record.key} derives from unknown key ${record.derivedFromAssetKey}`);
    }
  }

  // People validation.
  for (const person of dataset.people.records) {
    if (person.countrySlug && !countrySlugs.has(person.countrySlug)) {
      errors.push(`Person ${person.slug} references unknown country ${person.countrySlug}`);
    }
    if (person.citySlug && !citySlugs.has(person.citySlug)) {
      errors.push(`Person ${person.slug} references unknown city ${person.citySlug}`);
    }
    for (const role of person.roles ?? []) {
      if (!PERSON_ROLES.has(role)) errors.push(`Person ${person.slug} has invalid role "${role}"`);
    }
    if (person.profileImageKey && !mediaKeys.has(person.profileImageKey)) {
      errors.push(`Person ${person.slug} references unknown profileImageKey ${person.profileImageKey}`);
    }
  }

  // Event validation.
  for (const event of dataset.events.records) {
    if (!eventTypeSlugs.has(event.eventTypeSlug)) {
      errors.push(`Event ${event.slug} references unknown event type ${event.eventTypeSlug}`);
    }
    if (!countrySlugs.has(event.countrySlug)) {
      errors.push(`Event ${event.slug} references unknown country ${event.countrySlug}`);
    }
    if (event.citySlug) {
      const city = dataset.taxonomies.cities.find((c) => c.slug === event.citySlug);
      if (!city) errors.push(`Event ${event.slug} references unknown city ${event.citySlug}`);
      else if (city.countrySlug !== event.countrySlug) {
        errors.push(
          `Event ${event.slug}: city ${event.citySlug} belongs to ${city.countrySlug}, not ${event.countrySlug}`,
        );
      }
    }
    if (Number.isNaN(new Date(event.startDate).getTime())) {
      errors.push(`Event ${event.slug} has an invalid start date: ${event.startDate}`);
    }
    if (event.endDate && Number.isNaN(new Date(event.endDate).getTime())) {
      errors.push(`Event ${event.slug} has an invalid end date: ${event.endDate}`);
    }
    for (const key of [event.coverImageKey, event.posterImageKey, event.socialImageKey]) {
      if (key && !mediaKeys.has(key)) errors.push(`Event ${event.slug} references unknown media ${key}`);
    }
    for (const key of event.galleryImageKeys ?? []) {
      if (!mediaKeys.has(key)) errors.push(`Event ${event.slug} gallery references unknown media ${key}`);
    }
    for (const slug of event.participantSlugs ?? []) {
      if (!peopleSlugs.has(slug)) errors.push(`Event ${event.slug} references unknown person ${slug}`);
    }
    for (const day of event.programDays ?? []) {
      if (day.programImageKey && !mediaKeys.has(day.programImageKey)) {
        errors.push(`Event ${event.slug} program day references unknown media ${day.programImageKey}`);
      }
      for (const item of day.items ?? []) {
        if (item.presenterSlug && !peopleSlugs.has(item.presenterSlug)) {
          errors.push(`Event ${event.slug} program presenter ${item.presenterSlug} not found`);
        }
        for (const slug of item.participantSlugs ?? []) {
          if (!peopleSlugs.has(slug)) errors.push(`Event ${event.slug} program participant ${slug} not found`);
        }
      }
    }
  }

  // Literary works must reference known people.
  for (const work of dataset.literaryWorks.records) {
    if (!peopleSlugs.has(work.personSlug)) {
      errors.push(`Literary work ${work.slug} references unknown person ${work.personSlug}`);
    }
  }

  return { errors, warnings };
};
