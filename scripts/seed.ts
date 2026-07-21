import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";

import { emptyReport, parseFlags } from "./seed/helpers";
import { loadDataset, validateDataset } from "./seed/load-facebook-dataset";
import { seedTaxonomies } from "./seed/seed-taxonomies";
import { seedMedia } from "./seed/seed-media";
import { seedPeople } from "./seed/seed-people";
import { seedEvents } from "./seed/seed-events";
import { seedLiteraryWorks } from "./seed/seed-literary-works";
import { seedGlobals } from "./seed/seed-globals";
import { pruneLegacyPlaceholders } from "./seed/seed-legacy";
import type { SeedContext, SeedPayload, SeedReport } from "./seed/types";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(projectRoot, ".env.local") });
dotenv.config({ path: path.join(projectRoot, ".env") });

const packageRoot = path.join(projectRoot, "seed-data", "facebook-v2");
const dataDir = path.join(packageRoot, "data");
const imagesDir = path.join(packageRoot, "images");

const flags = parseFlags(process.argv.slice(2));

const printReport = (report: SeedReport, mode: string): void => {
  const line = (label: string, value: unknown) => console.log(`  ${label.padEnd(34)} ${value}`);
  console.log("\n============================================================");
  console.log(` Facebook content seed — ${mode}`);
  console.log("============================================================");
  line("Source package version:", report.packageVersion);
  line("Database connection:", "succeeded");
  console.log("--- Taxonomies ---");
  line("Countries (new/upd/same):", `${report.countries.created}/${report.countries.updated}/${report.countries.unchanged}`);
  line("Cities (new/upd/same):", `${report.cities.created}/${report.cities.updated}/${report.cities.unchanged}`);
  line("Event types (new/upd/same):", `${report.eventTypes.created}/${report.eventTypes.updated}/${report.eventTypes.unchanged}`);
  console.log("--- Media ---");
  line("Uploaded / reused / skipped:", `${report.media.uploaded} / ${report.media.reused} / ${report.media.skipped}`);
  console.log("--- People ---");
  line("Published:", report.people.published);
  line("Drafts:", report.people.drafts);
  line("Using country-unconfirmed:", report.people.missingCountry);
  line("Records (new/upd/same):", `${report.people.created}/${report.people.updated}/${report.people.unchanged}`);
  console.log("--- Events ---");
  line("Published:", report.events.published);
  line("Drafts:", report.events.drafts);
  line("Records (new/upd/same):", `${report.events.created}/${report.events.updated}/${report.events.unchanged}`);
  const omitted = Object.entries(report.events.omittedDraftParticipants);
  if (omitted.length) {
    for (const [slug, people] of omitted) {
      line(`  draft participants hidden (${slug}):`, `${people.length}`);
    }
  }
  console.log("--- Literary works ---");
  line("Drafts (new/upd/same):", `${report.literaryWorks.drafts} (${report.literaryWorks.created}/${report.literaryWorks.updated}/${report.literaryWorks.unchanged})`);
  console.log("--- Globals ---");
  line("Site-settings fields replaced:", report.siteSettingsReplaced.join(", ") || "none");
  line("Official email resolved:", `${report.officialEmail.resolved} (source: ${report.officialEmail.source})`);
  console.log("--- Legacy reconciliation ---");
  line("Adopted:", report.legacy.adopted.join("; ") || "none");
  line("Conflicts:", report.legacy.conflicts.join("; ") || "none");
  line("Pruned:", report.legacy.pruned.join("; ") || "none");
  line("Preserved:", report.legacy.preserved.join("; ") || "none");
  if (report.warnings.length) {
    console.log("--- Warnings ---");
    for (const warning of report.warnings) console.log(`  ! ${warning}`);
  }
  if (report.errors.length) {
    console.log("--- Errors ---");
    for (const error of report.errors) console.log(`  x ${error}`);
  }
  console.log("============================================================\n");
};

const run = async (): Promise<void> => {
  const mode = flags.dryRun ? "DRY RUN (no writes)" : "WRITE";
  console.log(
    `Seed mode: ${mode}` +
      `${flags.updateExisting ? " | update-existing" : ""}` +
      `${flags.pruneLegacyPlaceholders ? " | prune-legacy-placeholders" : ""}`,
  );

  const dataset = await loadDataset(dataDir);
  const report = emptyReport(dataset.version);

  // Fatal preflight validation against the referenced binaries and referential
  // integrity. These block the write run entirely.
  const { errors, warnings } = await validateDataset(dataset, packageRoot);
  report.errors.push(...errors);
  report.warnings.push(...warnings);
  if (errors.length) {
    console.error("Dataset validation failed — refusing to seed:");
    for (const error of errors) console.error(`  x ${error}`);
    printReport(report, mode);
    process.exit(1);
  }

  const { default: config } = await import("../src/payload.config");
  const payload = (await getPayload({ config })) as unknown as SeedPayload;

  const ctx: SeedContext = {
    payload,
    flags,
    report,
    countries: new Map(),
    cities: new Map(),
    eventTypes: new Map(),
    media: new Map(),
    people: new Map(),
    peopleStatus: new Map(),
    dataDir,
    imagesDir,
  };

  await seedTaxonomies(ctx, dataset);
  await seedMedia(ctx, dataset);
  await seedPeople(ctx, dataset);
  await seedEvents(ctx, dataset);
  await seedLiteraryWorks(ctx, dataset);
  await seedGlobals(ctx, dataset);
  await pruneLegacyPlaceholders(ctx);

  printReport(report, mode);

  if (report.errors.length) {
    console.error(`Seed completed with ${report.errors.length} error(s).`);
    process.exit(1);
  }
  console.log(
    flags.dryRun
      ? "Dry run complete. No changes were written."
      : "Seed completed successfully. Run again to verify idempotency.",
  );
  process.exit(0);
};

run().catch((error) => {
  console.error("Seed failed with an unexpected error:");
  console.error(error);
  process.exit(1);
});
