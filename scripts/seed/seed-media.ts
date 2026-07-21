import { readFile } from "node:fs/promises";
import path from "node:path";
import type { FacebookDataset, MediaRecord, SeedContext } from "./types";

const SEED_KEY_PREFIX = "facebook-seed-v2";
const SKIP_USAGES = new Set(["excluded", "review"]);

const mimeFor = (filePath: string): string => {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "avif") return "image/avif";
  return "application/octet-stream";
};

// Every media key any seeded entity references. Records with these keys are
// uploaded even if their seedUsage would otherwise be skipped.
const collectReferencedKeys = (dataset: FacebookDataset): Set<string> => {
  const keys = new Set<string>();
  for (const person of dataset.people.records) {
    if (person.profileImageKey) keys.add(person.profileImageKey);
  }
  for (const event of dataset.events.records) {
    for (const key of [event.coverImageKey, event.posterImageKey, event.socialImageKey]) {
      if (key) keys.add(key);
    }
    for (const key of event.galleryImageKeys ?? []) keys.add(key);
    for (const day of event.programDays ?? []) {
      if (day.programImageKey) keys.add(day.programImageKey);
    }
  }
  return keys;
};

export const seedMedia = async (
  ctx: SeedContext,
  dataset: FacebookDataset,
): Promise<void> => {
  const { payload, flags, report, imagesDir } = ctx;
  const packageRoot = path.dirname(imagesDir);
  const referenced = collectReferencedKeys(dataset);

  for (const record of dataset.media.records) {
    const isReferenced = referenced.has(record.key);
    if (SKIP_USAGES.has(record.seedUsage) && !isReferenced) {
      report.media.skipped += 1;
      continue;
    }

    const internalSeedKey = `${SEED_KEY_PREFIX}:${record.key}`;
    const existingResult = await payload.find({
      collection: "media",
      where: { internalSeedKey: { equals: internalSeedKey } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      locale: "ar",
      fallbackLocale: false,
    });
    const existing = existingResult.docs[0];

    if (existing) {
      // Never re-upload the binary; only refresh localized text when asked.
      if (flags.updateExisting && !flags.dryRun) {
        await updateMediaText(ctx, existing.id, record);
      }
      ctx.media.set(record.key, existing.id);
      report.media.reused += 1;
      continue;
    }

    if (flags.dryRun) {
      // No write; record intent and expose a resolvable sentinel so later
      // dry-run resolution does not report false "missing media" errors.
      ctx.media.set(record.key, `dry:${record.key}`);
      report.media.uploaded += 1;
      continue;
    }

    const absolutePath = path.join(packageRoot, record.filePath);
    const data = await readFile(absolutePath);
    if (!data.byteLength) {
      report.errors.push(`Media ${record.key}: empty file at ${record.filePath}`);
      continue;
    }
    const filename = path.basename(record.filePath);
    const created = await payload.create({
      collection: "media",
      locale: "ar",
      overrideAccess: true,
      data: {
        internalSeedKey,
        alt: record.alt.ar,
        caption: record.caption?.ar,
        credit: record.credit,
      },
      file: { data, mimetype: mimeFor(record.filePath), name: filename, size: data.byteLength },
    });
    await payload.update({
      collection: "media",
      id: created.id,
      locale: "en",
      overrideAccess: true,
      data: { alt: record.alt.en, caption: record.caption?.en },
    });
    ctx.media.set(record.key, created.id);
    report.media.uploaded += 1;
  }

  // Fail loudly if any seeded entity references a key that was not uploaded.
  for (const key of referenced) {
    if (!ctx.media.has(key)) {
      report.errors.push(`Referenced media key "${key}" was not uploaded or found`);
    }
  }
};

const updateMediaText = async (
  ctx: SeedContext,
  id: string | number,
  record: MediaRecord,
): Promise<void> => {
  await ctx.payload.update({
    collection: "media",
    id,
    locale: "ar",
    overrideAccess: true,
    data: { alt: record.alt.ar, caption: record.caption?.ar, credit: record.credit },
  });
  await ctx.payload.update({
    collection: "media",
    id,
    locale: "en",
    overrideAccess: true,
    data: { alt: record.alt.en, caption: record.caption?.en },
  });
};

/** Resolve a media key to an id, or push an error and return undefined. */
export const resolveMedia = (
  ctx: SeedContext,
  key: string | null | undefined,
  context: string,
): string | number | undefined => {
  if (!key) return undefined;
  const id = ctx.media.get(key);
  if (id === undefined) {
    ctx.report.errors.push(`${context}: missing media key "${key}"`);
    return undefined;
  }
  // Dry-run sentinels are resolvable but not real ids; callers omit them.
  if (typeof id === "string" && id.startsWith("dry:")) return undefined;
  return id;
};
