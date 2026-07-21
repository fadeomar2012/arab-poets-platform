// Shared types for the data-driven Facebook v2 seed.
//
// The runtime content lives entirely in JSON under seed-data/facebook-v2/data.
// These types describe the shape the loader validates against so the TypeScript
// seed stays a thin, well-typed orchestration layer over that data.

export type ID = number | string;

export type Locale = "ar" | "en";

export type Localized = { ar: string; en: string };

/** A minimal Payload surface — enough for the seed without importing the full
 *  generated client typings (which pull the whole config graph into tsx). */
export type SeedDocument = {
  id: ID;
  slug?: string;
  filename?: string;
  internalSeedKey?: string | null;
  _status?: "published" | "draft";
  [key: string]: unknown;
};

export type FindResult = { docs: SeedDocument[]; totalDocs: number };

export type SeedPayload = {
  find: (args: Record<string, unknown>) => Promise<FindResult>;
  findByID: (args: Record<string, unknown>) => Promise<SeedDocument>;
  findGlobal: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
  create: (args: Record<string, unknown>) => Promise<SeedDocument>;
  update: (args: Record<string, unknown>) => Promise<SeedDocument>;
  updateGlobal: (args: Record<string, unknown>) => Promise<unknown>;
  destroy?: () => Promise<void>;
};

export type SeedFlags = {
  dryRun: boolean;
  updateExisting: boolean;
  pruneLegacyPlaceholders: boolean;
};

// ---------------------------------------------------------------------------
// Dataset JSON shapes (seed-data/facebook-v2/data/*.json)
// ---------------------------------------------------------------------------

export type TaxonomyEntry = { slug: string; name: Localized; isActive?: boolean };
export type CityEntry = TaxonomyEntry & { countrySlug: string };

export type TaxonomiesFile = {
  version: string;
  eventTypes: TaxonomyEntry[];
  countries: TaxonomyEntry[];
  cities: CityEntry[];
};

export type MediaRecord = {
  key: string;
  filePath: string;
  assetType: string;
  seedUsage: string;
  personSlug?: string | null;
  eventSlug?: string | null;
  derivedFromAssetKey?: string | null;
  alt: Localized;
  caption?: Localized;
  credit?: string;
  sha256?: string;
};

export type MediaManifest = { version: string; policy?: string; records: MediaRecord[] };

export type PersonRecord = {
  slug: string;
  verificationStatus: "verified" | "needsReview";
  seedReadiness?: "ready" | "blocked-missing-country";
  name: Localized;
  countrySlug: string | null;
  citySlug: string | null;
  roles: string[];
  shortBio?: Localized;
  profileImageKey?: string | null;
  profileCardImageKey?: string | null;
  showContactPublicly: boolean;
  showInPublicDirectory: boolean;
  sources?: string[];
};

export type PeopleFile = { version: string; records: PersonRecord[] };

export type ProgramItemRecord = {
  title: Localized;
  startTime?: string;
  durationMinutes?: number;
  presenterSlug?: string;
  participantSlugs?: string[];
  description?: Localized;
  venue?: Localized;
};

export type ProgramDayRecord = {
  label: Localized;
  date?: string;
  programImageKey?: string;
  items: ProgramItemRecord[];
};

export type EventArchive = {
  sourceFacebookUrl?: string;
  verificationStatus: "unverified" | "needsReview" | "verified" | "approvedWithGaps";
  verificationNotes?: string;
};

export type EventRecord = {
  slug: string;
  verificationStatus: EventArchive["verificationStatus"];
  title: Localized;
  eventTypeSlug: string;
  editionNumber?: number;
  shortDescription: Localized;
  startDate: string;
  endDate?: string | null;
  startTimeLocal?: string | null;
  endTimeLocal?: string | null;
  timezone: string;
  countrySlug: string;
  citySlug?: string | null;
  venueName?: Localized;
  addressText?: Localized;
  attendanceMode?: string;
  programMode?: string;
  participantSlugs?: string[];
  posterImageKey?: string | null;
  coverImageKey?: string | null;
  socialImageKey?: string | null;
  galleryImageKeys?: string[];
  programDays?: ProgramDayRecord[];
  archive?: EventArchive;
};

export type EventsFile = { version: string; records: EventRecord[] };

export type LiteraryWorkRecord = {
  slug: string;
  verificationStatus: "verified" | "needsReview";
  personSlug: string;
  title: Localized;
  type: string;
  publicationYear?: number;
  description?: Localized;
  externalUrl?: string;
};

export type LiteraryWorksFile = { version: string; records: LiteraryWorkRecord[] };

export type SiteSettingsFile = {
  version: string;
  data: {
    associationName: Localized;
    slogan: Localized;
    officialEmail: string | null;
    whatsapp: string;
    socialLinks: { platform: string; url: string; verificationStatus: string }[];
    logoImageKey: string;
  };
};

export type FacebookDataset = {
  taxonomies: TaxonomiesFile;
  media: MediaManifest;
  people: PeopleFile;
  events: EventsFile;
  literaryWorks: LiteraryWorksFile;
  siteSettings: SiteSettingsFile;
  version: string;
};

// Resolution maps threaded through the seed pipeline.
export type IdMap = Map<string, ID>;

export type SeedContext = {
  payload: SeedPayload;
  flags: SeedFlags;
  report: SeedReport;
  countries: IdMap;
  cities: IdMap;
  eventTypes: IdMap;
  media: IdMap;
  people: IdMap;
  peopleStatus: Map<string, "published" | "draft">;
  dataDir: string;
  imagesDir: string;
};

export type SeedReport = {
  packageVersion: string;
  countries: { created: number; updated: number; unchanged: number };
  cities: { created: number; updated: number; unchanged: number };
  eventTypes: { created: number; updated: number; unchanged: number };
  media: { uploaded: number; reused: number; skipped: number };
  people: {
    published: number;
    drafts: number;
    missingCountry: number;
    created: number;
    updated: number;
    unchanged: number;
  };
  events: {
    published: number;
    drafts: number;
    created: number;
    updated: number;
    unchanged: number;
    omittedDraftParticipants: Record<string, string[]>;
  };
  literaryWorks: { drafts: number; created: number; updated: number; unchanged: number };
  siteSettingsReplaced: string[];
  officialEmail: { resolved: boolean; source: string; value?: string };
  legacy: { adopted: string[]; conflicts: string[]; pruned: string[]; preserved: string[] };
  warnings: string[];
  errors: string[];
};
