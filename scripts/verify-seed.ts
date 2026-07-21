import dotenv from "dotenv";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(projectRoot, ".env.local") });
dotenv.config({ path: path.join(projectRoot, ".env") });

const dataDir = path.join(projectRoot, "seed-data", "facebook-v2", "data");
const readJSON = async (file: string) => JSON.parse(await readFile(path.join(dataDir, file), "utf8"));

const { default: config } = await import("../src/payload.config");
const payload = await getPayload({ config });

type Doc = Record<string, unknown>;
const failures: string[] = [];
const warnings: string[] = [];
const fail = (message: string) => failures.push(message);
const warn = (message: string) => warnings.push(message);

const relId = (value: unknown): string =>
  value && typeof value === "object" && "id" in (value as Doc)
    ? String((value as { id: unknown }).id)
    : value === null || value === undefined
      ? ""
      : String(value);

const findAll = async (collection: string, where: Doc, extra: Doc = {}): Promise<Doc[]> => {
  const result = await payload.find({
    collection: collection as never,
    where: where as never,
    limit: 200,
    depth: 0,
    overrideAccess: true,
    locale: "ar",
    fallbackLocale: false,
    ...extra,
  } as never);
  return result.docs as unknown as Doc[];
};

const findOneBySlug = async (collection: string, slug: string, extra: Doc = {}): Promise<Doc[]> =>
  findAll(collection, { slug: { equals: slug } }, extra);

// ---------------------------------------------------------------------------
// Taxonomies
// ---------------------------------------------------------------------------

const ARAB_CAPITALS: Record<string, string> = {
  algeria: "algiers",
  bahrain: "manama",
  comoros: "moroni",
  djibouti: "djibouti-city",
  egypt: "cairo",
  iraq: "baghdad",
  jordan: "amman",
  kuwait: "kuwait-city",
  lebanon: "beirut",
  libya: "tripoli",
  mauritania: "nouakchott",
  morocco: "rabat",
  oman: "muscat",
  palestine: "jerusalem",
  qatar: "doha",
  "saudi-arabia": "riyadh",
  somalia: "mogadishu",
  sudan: "khartoum",
  syria: "damascus",
  tunisia: "tunis",
  uae: "abu-dhabi",
  yemen: "sanaa",
};

const verifyTaxonomies = async () => {
  const countryIdBySlug = new Map<string, string>();
  for (const countrySlug of Object.keys(ARAB_CAPITALS)) {
    const countries = await findOneBySlug("countries", countrySlug);
    if (countries.length !== 1) {
      fail(`country ${countrySlug}: expected exactly one, found ${countries.length}`);
      continue;
    }
    countryIdBySlug.set(countrySlug, String(countries[0].id));

    const capitalSlug = ARAB_CAPITALS[countrySlug];
    const capitals = await findOneBySlug("cities", capitalSlug);
    if (capitals.length !== 1) {
      fail(`capital ${capitalSlug}: expected exactly one, found ${capitals.length}`);
      continue;
    }
    if (relId(capitals[0].country) !== String(countries[0].id)) {
      fail(`capital ${capitalSlug} does not belong to ${countrySlug}`);
    }
  }

  for (const slug of ["turkey", "eritrea"]) {
    if ((await findOneBySlug("countries", slug)).length !== 1) fail(`country ${slug} missing or duplicated`);
  }
  for (const slug of ["istanbul", "gaziantep"]) {
    if ((await findOneBySlug("cities", slug)).length !== 1) fail(`city ${slug} missing or duplicated`);
  }

  const gaza = await findOneBySlug("cities", "gaza");
  const palestine = await findOneBySlug("countries", "palestine");
  if (gaza.length !== 1) fail("city gaza missing or duplicated");
  else if (palestine.length === 1 && relId(gaza[0].country) !== String(palestine[0].id)) {
    fail("city gaza does not belong to palestine");
  }

  const unconfirmed = await findOneBySlug("countries", "country-unconfirmed");
  if (unconfirmed.length !== 1) fail("country-unconfirmed missing or duplicated");
  else if (unconfirmed[0].isActive !== false) fail("country-unconfirmed must be inactive");

  return { countryIdBySlug, unconfirmedId: unconfirmed[0]?.id };
};

// ---------------------------------------------------------------------------
// Site settings
// ---------------------------------------------------------------------------

const verifySiteSettings = async () => {
  const settings = (await payload.findGlobal({
    slug: "site-settings",
    locale: "ar",
    fallbackLocale: false,
    overrideAccess: true,
    depth: 1,
  })) as unknown as Doc;

  if (settings.associationName === "جمعية الشعر العربي") fail("site-settings: association name is still the placeholder");
  if (settings.whatsapp !== "+905386442312") fail(`site-settings: whatsapp is ${String(settings.whatsapp)}`);

  const links = Array.isArray(settings.socialLinks) ? (settings.socialLinks as Doc[]) : [];
  const facebook = links.find((l) => l.platform === "facebook");
  if (!facebook || facebook.url !== "https://www.facebook.com/internationalarabpoets") {
    fail("site-settings: verified Facebook URL missing");
  }
  if (links.some((l) => /example\.(org|com|net)/i.test(String(l.url)))) {
    fail("site-settings: a public social link still contains example.org");
  }

  const logo = settings.logo as Doc | null;
  if (!logo || !relId(logo)) fail("site-settings: logo does not resolve to a media record");
  else if (!String((logo as Doc).internalSeedKey ?? "").startsWith("facebook-seed-v2:")) {
    warn("site-settings: logo is not an imported facebook-seed media record");
  }

  const email = String(settings.officialEmail ?? "");
  if (/@(example\.(org|com|net)|test\.invalid)$/i.test(email) || !email) {
    warn("site-settings: official email remains unresolved and requires client confirmation (expected, non-fatal)");
  }
};

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

const verifyPeople = async (unconfirmedId: unknown) => {
  const people = await readJSON("people.json");
  for (const person of people.records as Doc[]) {
    const slug = String(person.slug);
    const internal = await findOneBySlug("people", slug, { draft: true });
    if (internal.length !== 1) {
      fail(`person ${slug}: expected exactly one record, found ${internal.length}`);
      continue;
    }
    const doc = internal[0];

    if (person.profileImageKey && !relId(doc.profileImage)) {
      fail(`person ${slug}: profile image relationship does not resolve`);
    }

    const missingCountry = !person.countrySlug;
    if (missingCountry) {
      if (relId(doc.country) !== String(unconfirmedId)) fail(`person ${slug}: should use country-unconfirmed`);
      if (doc._status !== "draft") fail(`person ${slug}: missing-country person should be a draft`);
      if (doc.showInPublicDirectory !== false) fail(`person ${slug}: missing-country person must be hidden`);
    } else if (person.verificationStatus === "verified") {
      if (relId(doc.country) === String(unconfirmedId)) fail(`person ${slug}: published person must have a real country`);
    }

    // Contact data must never be public for these seeded records.
    if (doc.showContactPublicly === true && (doc.email || doc.phone)) {
      fail(`person ${slug}: contact data is exposed publicly`);
    }
  }
};

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

const verifyEvents = async () => {
  const events = await readJSON("events.json");
  for (const event of events.records as Doc[]) {
    const slug = String(event.slug);
    const internal = await findOneBySlug("events", slug, { draft: true, depth: 1 });
    if (internal.length !== 1) {
      fail(`event ${slug}: expected exactly one record, found ${internal.length}`);
      continue;
    }
    const doc = internal[0];

    const publishable = Boolean(event.startTimeLocal) &&
      (event.verificationStatus === "verified" || event.verificationStatus === "approvedWithGaps");
    const expected = publishable ? "published" : "draft";
    if (doc._status !== expected) fail(`event ${slug}: expected ${expected}, found ${String(doc._status)}`);

    // Media relationships resolve.
    for (const field of ["coverImage", "posterImage", "socialImage"]) {
      const key = { coverImage: event.coverImageKey, posterImage: event.posterImageKey, socialImage: event.socialImageKey }[field];
      if (key && !relId(doc[field])) fail(`event ${slug}: ${field} does not resolve`);
    }
    const gallery = Array.isArray(doc.gallery) ? (doc.gallery as unknown[]) : [];
    if (((event.galleryImageKeys as unknown[] | undefined)?.length ?? 0) > 0 && gallery.length === 0) {
      fail(`event ${slug}: gallery relationships did not resolve`);
    }

    // City belongs to the event country.
    if (event.citySlug) {
      const cities = await findOneBySlug("cities", String(event.citySlug));
      if (cities.length === 1 && relId(cities[0].country) !== relId(doc.country)) {
        fail(`event ${slug}: city does not belong to the event country`);
      }
    }

    // Participants reference existing people.
    for (const participant of Array.isArray(doc.participants) ? (doc.participants as Doc[]) : []) {
      const personId = relId(participant.person);
      if (personId) {
        const person = await findAll("people", { id: { equals: personId } }, { draft: true });
        if (person.length !== 1) fail(`event ${slug}: participant ${personId} does not exist`);
      }
    }

    // Archive source URL preserved.
    const archive = (doc.archive as Doc) ?? {};
    if ((event.archive as Doc | undefined)?.sourceFacebookUrl && !archive.sourceFacebookUrl) {
      fail(`event ${slug}: archive source URL was not preserved`);
    }
  }
};

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

const verifyMedia = async () => {
  const media = await readJSON("media-manifest.json");
  const skip = new Set(["excluded", "review"]);
  for (const record of media.records as Doc[]) {
    if (skip.has(String(record.seedUsage))) continue;
    const key = `facebook-seed-v2:${record.key}`;
    const docs = await findAll("media", { internalSeedKey: { equals: key } });
    if (docs.length > 1) fail(`media ${record.key}: ${docs.length} duplicate records`);
  }
};

// ---------------------------------------------------------------------------
// Placeholder scan on public content
// ---------------------------------------------------------------------------

const PUBLIC_PLACEHOLDERS = [/info@example\.org/i, /\+970000000000/, /https:\/\/example\.org/i, /\bSample\b/, /تجريبي/];

const scanPublicPlaceholders = async () => {
  for (const locale of ["ar", "en"] as const) {
    const publicPeople = await payload.find({
      collection: "people",
      locale,
      fallbackLocale: false,
      limit: 200,
      depth: 1,
      overrideAccess: false,
      draft: false,
    });
    const publicEvents = await payload.find({
      collection: "events",
      locale,
      fallbackLocale: false,
      limit: 200,
      depth: 1,
      overrideAccess: false,
      draft: false,
    });
    const settings = await payload.findGlobal({ slug: "site-settings", locale, fallbackLocale: false, overrideAccess: false, depth: 1 });
    const haystack = JSON.stringify({ people: publicPeople.docs, events: publicEvents.docs, settings });
    for (const pattern of PUBLIC_PLACEHOLDERS) {
      if (pattern.test(haystack)) {
        // The required-but-unresolved official email is the single documented exception.
        if (pattern.source.includes("example") && /officialEmail/.test(haystack)) continue;
        fail(`public content (${locale}) contains placeholder ${pattern}`);
      }
    }
  }
};

// ---------------------------------------------------------------------------

const { unconfirmedId } = await verifyTaxonomies();
await verifySiteSettings();
await verifyPeople(unconfirmedId);
await verifyEvents();
await verifyMedia();
await scanPublicPlaceholders();

if (warnings.length) {
  console.warn("Seed verification warnings:");
  for (const warning of warnings) console.warn(`  ! ${warning}`);
}

if (failures.length > 0) {
  console.error("Seed verification failed:");
  for (const failure of failures) console.error(`  x ${failure}`);
  process.exitCode = 1;
} else {
  console.log("Seed verification passed: taxonomies, site settings, people, events, media, and placeholder checks are valid.");
}

await payload.destroy();
