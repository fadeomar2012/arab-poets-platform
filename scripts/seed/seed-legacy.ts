import { findBySlug, looksLikePlaceholder, reconcileStatus } from "./helpers";
import type { SeedContext } from "./types";

// Old hardcoded seed-only fixtures that are NOT part of the new dataset. Under
// --prune-legacy-placeholders they are softly retired (never hard-deleted) only
// when positively identified as placeholder content. Real records that happen
// to share a real-world name are never touched.
type LegacyFixture = {
  slug: string;
  collection: "people" | "events" | "partners" | "literary-works";
  action: "unpublish" | "hide-person" | "deactivate-partner";
};

const LEGACY_FIXTURES: LegacyFixture[] = [
  { slug: "draft-poet-profile", collection: "people", action: "hide-person" },
  { slug: "cairo-contemporary-poetry-evening", collection: "events", action: "unpublish" },
  { slug: "arab-cultural-center", collection: "partners", action: "deactivate-partner" },
  { slug: "poetry-media-network", collection: "partners", action: "deactivate-partner" },
  { slug: "at-the-edge-of-light", collection: "literary-works", action: "unpublish" },
  { slug: "memory-of-cities", collection: "literary-works", action: "unpublish" },
  { slug: "modern-poetry-dialogue", collection: "literary-works", action: "unpublish" },
];

export const pruneLegacyPlaceholders = async (ctx: SeedContext): Promise<void> => {
  const { payload, flags, report } = ctx;
  if (!flags.pruneLegacyPlaceholders) return;

  for (const fixture of LEGACY_FIXTURES) {
    const doc = await findBySlug(payload, fixture.collection, fixture.slug);
    if (!doc) continue;

    // Positive identification: exact known slug AND placeholder content markers.
    if (!looksLikePlaceholder(doc)) {
      report.legacy.preserved.push(`${fixture.slug} (no placeholder markers; left untouched)`);
      continue;
    }

    if (flags.dryRun) {
      report.legacy.pruned.push(`${fixture.slug} (would ${fixture.action})`);
      continue;
    }

    if (fixture.action === "unpublish") {
      await reconcileStatus(payload, fixture.collection, doc.id, false);
    } else if (fixture.action === "hide-person") {
      await reconcileStatus(payload, fixture.collection, doc.id, false);
      await payload.update({
        collection: fixture.collection,
        id: doc.id,
        locale: "ar",
        overrideAccess: true,
        data: { showInPublicDirectory: false },
      });
    } else if (fixture.action === "deactivate-partner") {
      await payload.update({
        collection: fixture.collection,
        id: doc.id,
        locale: "ar",
        overrideAccess: true,
        data: { isActive: false },
      });
    }
    report.legacy.pruned.push(`${fixture.slug} (${fixture.action})`);
  }
};
