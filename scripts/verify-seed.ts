import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(projectRoot, ".env.local") });
dotenv.config({ path: path.join(projectRoot, ".env") });

const { default: config } = await import("../src/payload.config");
const payload = await getPayload({ config });

type Locale = "ar" | "en";
type VersionedCollection = "events" | "people";

type VersionedCheck = {
  label: string;
  collection: VersionedCollection;
  slug: string;
  expectedStatus: "published" | "draft";
  publicVisible: boolean;
};

const versionedChecks: VersionedCheck[] = [
  {
    label: "published upcoming event",
    collection: "events",
    slug: "istanbul-poetry-forum-2026",
    expectedStatus: "published",
    publicVisible: true,
  },
  {
    label: "published past event",
    collection: "events",
    slug: "arab-poetry-festival-eighth",
    expectedStatus: "published",
    publicVisible: true,
  },
  {
    label: "draft event",
    collection: "events",
    slug: "cairo-contemporary-poetry-evening",
    expectedStatus: "draft",
    publicVisible: false,
  },
  {
    label: "public person",
    collection: "people",
    slug: "mustafa-matar",
    expectedStatus: "published",
    publicVisible: true,
  },
  {
    label: "hidden draft person",
    collection: "people",
    slug: "draft-poet-profile",
    expectedStatus: "draft",
    publicVisible: false,
  },
];

const failures: string[] = [];
const locales: Locale[] = ["ar", "en"];

for (const check of versionedChecks) {
  for (const locale of locales) {
    const internal = await payload.find({
      collection: check.collection,
      locale,
      fallbackLocale: false,
      where: { slug: { equals: check.slug } },
      limit: 2,
      depth: 0,
      overrideAccess: true,
      draft: true,
    });

    if (internal.totalDocs !== 1) {
      failures.push(
        `${check.label} (${locale}): expected exactly one internal record, found ${internal.totalDocs}`,
      );
      continue;
    }

    const document = internal.docs[0] as { _status?: "published" | "draft" };
    if (document._status !== check.expectedStatus) {
      failures.push(
        `${check.label} (${locale}): expected status ${check.expectedStatus}, found ${document._status ?? "missing"}`,
      );
    }

    const publicResult = await payload.find({
      collection: check.collection,
      locale,
      fallbackLocale: false,
      where: { slug: { equals: check.slug } },
      limit: 2,
      depth: 0,
      overrideAccess: false,
      draft: false,
    });
    const isVisible = publicResult.totalDocs === 1;
    if (isVisible !== check.publicVisible) {
      failures.push(
        `${check.label} (${locale}): expected publicVisible=${check.publicVisible}, found ${isVisible}`,
      );
    }
  }
}

const mediaSeedKeys = [
  "logo.png",
  "istanbul-event.png",
  "poets-poster.png",
  "event-square.png",
  "association-photo.png",
].map((filename) => `seed-media:${filename}`);

for (const mediaSeedKey of mediaSeedKeys) {
  const media = await payload.find({
    collection: "media",
    locale: "ar",
    fallbackLocale: false,
    where: { internalSeedKey: { equals: mediaSeedKey } },
    limit: 2,
    depth: 0,
    overrideAccess: true,
  });

  if (media.totalDocs !== 1) {
    failures.push(
      `seed media: expected exactly one record for ${mediaSeedKey}, found ${media.totalDocs}`,
    );
    continue;
  }

  const mediaDocument = media.docs[0] as {
    cloudinarySecureUrl?: string | null;
    url?: string | null;
  };
  const mediaURL = mediaDocument.cloudinarySecureUrl || mediaDocument.url || "";
  if (!mediaURL) failures.push(`seed media (${mediaSeedKey}): URL is missing`);
  if (mediaURL.includes("prefix=")) {
    failures.push(
      `seed media (${mediaSeedKey}): URL still contains an invalid Payload prefix query (${mediaURL})`,
    );
  }
}

for (const locale of locales) {
  const homepage = await payload.findGlobal({
    slug: "homepage",
    locale,
    fallbackLocale: false,
    overrideAccess: true,
    draft: false,
    depth: 0,
  });
  const homepageRecord = homepage as {
    _status?: "published" | "draft";
    heroMode?: string;
    featuredEvent?: unknown;
  };
  if (homepageRecord._status !== "published") {
    failures.push(`homepage (${locale}): expected published status`);
  }
  if (homepageRecord.heroMode !== "featuredEvent" || !homepageRecord.featuredEvent) {
    failures.push(`homepage (${locale}): featured event configuration is missing`);
  }
}

for (const locale of locales) {
  const publicEvents = await payload.find({
    collection: "events",
    locale,
    fallbackLocale: false,
    where: { _status: { equals: "published" } },
    limit: 20,
    depth: 0,
    overrideAccess: false,
    draft: false,
  });
  if (publicEvents.totalDocs < 2) {
    failures.push(
      `events (${locale}): expected at least two public events, found ${publicEvents.totalDocs}`,
    );
  }
}

if (failures.length > 0) {
  console.error("Seed verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("Seed verification passed for Arabic and English.");
  console.log("Localized publication status, public visibility, media URLs, and homepage data are valid.");
}

await payload.destroy();
