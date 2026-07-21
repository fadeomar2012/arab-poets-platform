import { tallyOutcome, upsertLocalized } from "./helpers";
import { resolveMedia } from "./seed-media";
import { COUNTRY_UNCONFIRMED_SLUG } from "./seed-taxonomies";
import type { FacebookDataset, PersonRecord, SeedContext } from "./types";

type Plan = {
  countryId: string | number;
  published: boolean;
  showInPublicDirectory: boolean;
  showContactPublicly: boolean;
  missingCountry: boolean;
};

// Publication rules (see task sections 7 & 9):
//  - No country            -> country-unconfirmed, draft, hidden, no contact.
//  - verified + country    -> published, respect source directory/contact flags.
//  - needsReview + country -> draft, contact never exposed.
const planPerson = (ctx: SeedContext, person: PersonRecord): Plan | null => {
  if (!person.countrySlug) {
    const countryId = ctx.countries.get(COUNTRY_UNCONFIRMED_SLUG);
    if (countryId === undefined) {
      ctx.report.errors.push(`Person ${person.slug}: country-unconfirmed record missing`);
      return null;
    }
    return {
      countryId,
      published: false,
      showInPublicDirectory: false,
      showContactPublicly: false,
      missingCountry: true,
    };
  }

  const countryId = ctx.countries.get(person.countrySlug);
  if (countryId === undefined) {
    ctx.report.errors.push(`Person ${person.slug}: country ${person.countrySlug} not seeded`);
    return null;
  }

  const published = person.verificationStatus === "verified";
  return {
    countryId,
    published,
    showInPublicDirectory: Boolean(person.showInPublicDirectory),
    showContactPublicly: published ? Boolean(person.showContactPublicly) : false,
    missingCountry: false,
  };
};

export const seedPeople = async (
  ctx: SeedContext,
  dataset: FacebookDataset,
): Promise<void> => {
  const { payload, flags, report } = ctx;
  let order = 1;

  for (const person of dataset.people.records) {
    const plan = planPerson(ctx, person);
    if (!plan) continue;

    const cityId = person.citySlug ? ctx.cities.get(person.citySlug) : undefined;
    const profileImage = resolveMedia(ctx, person.profileImageKey, `person ${person.slug}`);

    const common: Record<string, unknown> = {
      country: plan.countryId,
      roles: person.roles ?? [],
      showContactPublicly: plan.showContactPublicly,
      showInPublicDirectory: plan.showInPublicDirectory,
      displayOrder: order++,
    };
    if (cityId !== undefined) common.city = cityId;
    if (profileImage !== undefined) common.profileImage = profileImage;

    ctx.peopleStatus.set(person.slug, plan.published ? "published" : "draft");

    if (plan.published) report.people.published += 1;
    else report.people.drafts += 1;
    if (plan.missingCountry) report.people.missingCountry += 1;

    if (flags.dryRun) {
      ctx.people.set(person.slug, `dry:${person.slug}`);
      continue;
    }

    const { doc, outcome } = await upsertLocalized(payload, flags, {
      collection: "people",
      slug: person.slug,
      common,
      ar: { name: person.name.ar, shortBio: person.shortBio?.ar },
      en: { name: person.name.en, shortBio: person.shortBio?.en },
      versioned: true,
      published: plan.published,
    });
    ctx.people.set(person.slug, doc.id);
    tallyOutcome(report.people, outcome);
  }
};
