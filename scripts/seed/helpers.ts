import type {
  ID,
  Locale,
  SeedDocument,
  SeedFlags,
  SeedPayload,
  SeedReport,
} from "./types";

// ---------------------------------------------------------------------------
// Flags
// ---------------------------------------------------------------------------

export const parseFlags = (argv: string[]): SeedFlags => {
  const args = new Set(argv);
  return {
    dryRun: args.has("--dry-run"),
    // Preserve backward compatibility with the historical env switch.
    updateExisting:
      args.has("--update-existing") || process.env.SEED_UPDATE_EXISTING === "true",
    pruneLegacyPlaceholders: args.has("--prune-legacy-placeholders"),
  };
};

export const emptyReport = (packageVersion: string): SeedReport => ({
  packageVersion,
  countries: { created: 0, updated: 0, unchanged: 0 },
  cities: { created: 0, updated: 0, unchanged: 0 },
  eventTypes: { created: 0, updated: 0, unchanged: 0 },
  media: { uploaded: 0, reused: 0, skipped: 0 },
  people: { published: 0, drafts: 0, missingCountry: 0, created: 0, updated: 0, unchanged: 0 },
  events: {
    published: 0,
    drafts: 0,
    created: 0,
    updated: 0,
    unchanged: 0,
    omittedDraftParticipants: {},
  },
  literaryWorks: { drafts: 0, created: 0, updated: 0, unchanged: 0 },
  siteSettingsReplaced: [],
  officialEmail: { resolved: false, source: "none" },
  legacy: { adopted: [], conflicts: [], pruned: [], preserved: [] },
  warnings: [],
  errors: [],
});

// ---------------------------------------------------------------------------
// Rich text (Lexical) — only used where the schema expects rich text.
// ---------------------------------------------------------------------------

export const richText = (text: string, direction: "rtl" | "ltr" = "rtl") => ({
  root: {
    type: "root",
    format: "",
    indent: 0,
    version: 1,
    direction,
    children: [
      {
        type: "paragraph",
        format: "",
        indent: 0,
        version: 1,
        direction,
        children: [
          { type: "text", detail: 0, format: 0, mode: "normal", style: "", text, version: 1 },
        ],
      },
    ],
  },
});

// ---------------------------------------------------------------------------
// Timezone-aware date/time conversion
// ---------------------------------------------------------------------------

// Offset (ms) that `timeZone` is ahead of UTC at the given instant.
const zoneOffsetMs = (instant: Date, timeZone: string): number => {
  const asUTC = new Date(instant.toLocaleString("en-US", { timeZone: "UTC" }));
  const asZone = new Date(instant.toLocaleString("en-US", { timeZone }));
  return asZone.getTime() - asUTC.getTime();
};

/**
 * Convert a wall-clock local date/time in `timeZone` into a UTC ISO string.
 * `date` is "YYYY-MM-DD"; `time` is "HH:mm" (defaults to noon when absent, a
 * deterministic technical placeholder — callers keep such records as drafts and
 * annotate the unconfirmed time in verification notes rather than presenting it
 * as fact).
 */
export const toUtcISO = (
  date: string,
  time: string | null | undefined,
  timeZone: string,
): { iso: string; timeAssumed: boolean } => {
  const timeAssumed = !time;
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = (time || "12:00").split(":").map(Number);
  // Interpret the wall time as if it were UTC, then correct by the zone offset.
  const naiveUTC = Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0);
  const offset = zoneOffsetMs(new Date(naiveUTC), timeZone);
  return { iso: new Date(naiveUTC - offset).toISOString(), timeAssumed };
};

// ---------------------------------------------------------------------------
// Placeholder detection (used for legacy reconciliation, never for real data)
// ---------------------------------------------------------------------------

const PLACEHOLDER_MARKERS = [
  "example.org",
  "example.com",
  "info@example",
  "+970000000000",
  "تجريبي",
  "تجريبية",
  "مسودة فعالية لا يجب أن تظهر",
  "sample",
];

export const looksLikePlaceholder = (doc: SeedDocument): boolean => {
  const haystack = JSON.stringify(doc ?? {}).toLowerCase();
  return PLACEHOLDER_MARKERS.some((marker) => haystack.includes(marker.toLowerCase()));
};

const PLACEHOLDER_EMAIL = /@(example\.(org|com|net)|test\.invalid)$/i;
export const isValidRealEmail = (value: unknown): boolean => {
  if (typeof value !== "string") return false;
  const email = value.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
  return !PLACEHOLDER_EMAIL.test(email);
};

// ---------------------------------------------------------------------------
// Relationship id normalization + change detection
// ---------------------------------------------------------------------------

export const relID = (value: unknown): string => {
  if (value && typeof value === "object" && "id" in (value as Record<string, unknown>)) {
    return String((value as { id: ID }).id);
  }
  return value === null || value === undefined ? "" : String(value);
};

// Project the existing document into the same shape as the intended `template`
// so the two can be JSON-compared. Relationship leaves collapse to string ids;
// array rows are zipped positionally (Payload-assigned row ids are ignored
// because the template never carries them). This lets an --update-existing run
// skip writes when nothing actually changed, preventing version-history growth.
const projectExisting = (existing: unknown, template: unknown): unknown => {
  if (Array.isArray(template)) {
    const source = Array.isArray(existing) ? existing : [];
    return template.map((item, index) => projectExisting(source[index], item));
  }
  if (template && typeof template === "object") {
    const src = existing && typeof existing === "object" ? (existing as Record<string, unknown>) : {};
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(template as Record<string, unknown>)) {
      out[key] = projectExisting(src[key], (template as Record<string, unknown>)[key]);
    }
    return out;
  }
  // scalar / relationship leaf
  return relID(existing);
};

const normalizeTemplate = (template: unknown): unknown => {
  if (Array.isArray(template)) return template.map(normalizeTemplate);
  if (template && typeof template === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(template as Record<string, unknown>)) {
      out[key] = normalizeTemplate((template as Record<string, unknown>)[key]);
    }
    return out;
  }
  return relID(template);
};

const stableStringify = (value: unknown): string => {
  const seen = new WeakSet();
  const walk = (input: unknown): unknown => {
    if (input && typeof input === "object") {
      if (seen.has(input as object)) return null;
      seen.add(input as object);
      if (Array.isArray(input)) return input.map(walk);
      const sorted: Record<string, unknown> = {};
      for (const key of Object.keys(input as Record<string, unknown>).sort()) {
        sorted[key] = walk((input as Record<string, unknown>)[key]);
      }
      return sorted;
    }
    return input;
  };
  return JSON.stringify(walk(value));
};

export const sameContent = (existing: SeedDocument, template: Record<string, unknown>): boolean =>
  stableStringify(normalizeTemplate(template)) === stableStringify(projectExisting(existing, template));

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

export const findBySlug = async (
  payload: SeedPayload,
  collection: string,
  slug: string,
): Promise<SeedDocument | undefined> => {
  const result = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    draft: true,
    locale: "ar",
    fallbackLocale: false,
  });
  return result.docs[0];
};

// Read the LIVE published projection for one locale (draft:false returns a doc
// only when it is actually published for that locale under localizeStatus).
const isLivePublished = async (
  payload: SeedPayload,
  collection: string,
  id: ID,
  locale: Locale,
): Promise<boolean> => {
  const live = await payload.find({
    collection,
    locale,
    fallbackLocale: false,
    where: { id: { equals: id } },
    limit: 1,
    depth: 0,
    overrideAccess: false,
    draft: false,
  });
  return live.totalDocs === 1;
};

export const reconcileStatus = async (
  payload: SeedPayload,
  collection: string,
  id: ID,
  published: boolean,
): Promise<boolean> => {
  let changed = false;
  for (const locale of ["ar", "en"] as const) {
    if ((await isLivePublished(payload, collection, id, locale)) !== published) {
      await payload.update({
        collection,
        id,
        locale,
        overrideAccess: true,
        data: { _status: published ? "published" : "draft" },
      });
      changed = true;
    }
  }
  return changed;
};

// ---------------------------------------------------------------------------
// Generic localized upsert with idempotent change detection
// ---------------------------------------------------------------------------

export type UpsertOutcome = "created" | "updated" | "unchanged";

export type UpsertArgs = {
  collection: string;
  slug: string;
  common?: Record<string, unknown>;
  ar: Record<string, unknown>;
  en: Record<string, unknown>;
  versioned?: boolean;
  published?: boolean;
  // Force a content refresh even without --update-existing (legacy adoption /
  // placeholder reconciliation).
  forceUpdate?: boolean;
};

export type UpsertResult = { doc: SeedDocument; outcome: UpsertOutcome };

export const upsertLocalized = async (
  payload: SeedPayload,
  flags: SeedFlags,
  args: UpsertArgs,
): Promise<UpsertResult> => {
  const { collection, slug, common = {}, ar, en, versioned = false, published = true } = args;
  const existing = await findBySlug(payload, collection, slug);
  const shouldWriteContent = !existing || flags.updateExisting || args.forceUpdate;

  // Dry run: perform no writes. Report the would-be outcome and hand back either
  // the real existing id or a resolvable sentinel so downstream relationship
  // resolution does not report false "missing" errors.
  if (flags.dryRun) {
    if (!existing) return { doc: { id: `dry:${slug}`, slug }, outcome: "created" };
    return { doc: existing, outcome: shouldWriteContent ? "updated" : "unchanged" };
  }

  const arData = {
    ...common,
    ...ar,
    slug,
    ...(versioned ? { _status: published ? "published" : "draft" } : {}),
  };
  const enData = {
    ...en,
    ...(versioned ? { _status: published ? "published" : "draft" } : {}),
  };

  // Existing record we must not rewrite: keep the historical read-only path so a
  // steady-state seed never grows version history. Status is still reconciled.
  if (existing && !shouldWriteContent) {
    if (versioned) await reconcileStatus(payload, collection, existing.id, published);
    return { doc: existing, outcome: "unchanged" };
  }

  if (existing) {
    // Change detection: read both locales at depth 0 and compare the managed
    // fields. Skip the write entirely when nothing changed.
    const [arExisting, enExisting] = await Promise.all([
      payload.findByID({ collection, id: existing.id, locale: "ar", fallbackLocale: false, depth: 0, overrideAccess: true, draft: true }),
      payload.findByID({ collection, id: existing.id, locale: "en", fallbackLocale: false, depth: 0, overrideAccess: true, draft: true }),
    ]);
    const arCompare = { ...common, ...ar };
    const contentSame =
      sameContent(arExisting, arCompare) && sameContent(enExisting, en);
    const statusSame = !versioned
      ? true
      : (await isLivePublished(payload, collection, existing.id, "ar")) === published &&
        (await isLivePublished(payload, collection, existing.id, "en")) === published;

    if (contentSame && statusSame) return { doc: existing, outcome: "unchanged" };

    const updated = await payload.update({
      collection,
      id: existing.id,
      locale: "ar",
      overrideAccess: true,
      ...(versioned ? { draft: !published } : {}),
      data: arData,
    });
    await payload.update({
      collection,
      id: updated.id,
      locale: "en",
      overrideAccess: true,
      ...(versioned ? { draft: !published } : {}),
      data: enData,
    });
    return { doc: updated, outcome: "updated" };
  }

  const created = await payload.create({
    collection,
    locale: "ar",
    overrideAccess: true,
    ...(versioned ? { draft: !published } : {}),
    data: arData,
  });
  await payload.update({
    collection,
    id: created.id,
    locale: "en",
    overrideAccess: true,
    ...(versioned ? { draft: !published } : {}),
    data: enData,
  });
  return { doc: created, outcome: "created" };
};

export const tallyOutcome = (
  bucket: { created: number; updated: number; unchanged: number },
  outcome: UpsertOutcome,
): void => {
  bucket[outcome] += 1;
};
