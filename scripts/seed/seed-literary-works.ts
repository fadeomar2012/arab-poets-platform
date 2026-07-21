import { tallyOutcome, upsertLocalized } from "./helpers";
import type { FacebookDataset, SeedContext } from "./types";

const VALID_TYPES = new Set([
  "poetryCollection",
  "book",
  "poem",
  "article",
  "audio",
  "recitationVideo",
  "interview",
  "other",
]);

// All prepared literary works require editorial review, so every record is
// created as a draft. They also stay draft because their related people are
// themselves unpublished review drafts.
export const seedLiteraryWorks = async (
  ctx: SeedContext,
  dataset: FacebookDataset,
): Promise<void> => {
  const { payload, flags, report } = ctx;
  let order = 1;

  for (const work of dataset.literaryWorks.records) {
    const personId = ctx.people.get(work.personSlug);
    if (personId === undefined) {
      report.errors.push(`Literary work ${work.slug}: person ${work.personSlug} not resolved`);
      continue;
    }
    const type = VALID_TYPES.has(work.type) ? work.type : "other";

    report.literaryWorks.drafts += 1;
    if (flags.dryRun || (typeof personId === "string" && personId.startsWith("dry:"))) continue;

    const common: Record<string, unknown> = { person: personId, type, order: order++ };
    if (work.publicationYear) common.publicationYear = work.publicationYear;
    if (work.externalUrl) common.externalUrl = work.externalUrl;

    const { outcome } = await upsertLocalized(payload, flags, {
      collection: "literary-works",
      slug: work.slug,
      common,
      ar: { title: work.title.ar, description: work.description?.ar },
      en: { title: work.title.en, description: work.description?.en },
      versioned: true,
      published: false,
    });
    tallyOutcome(report.literaryWorks, outcome);
  }
};
