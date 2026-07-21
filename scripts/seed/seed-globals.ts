import { findBySlug, isValidRealEmail } from "./helpers";
import { resolveMedia } from "./seed-media";
import { HOMEPAGE_FEATURED_EVENT } from "./seed-events";
import type { FacebookDataset, ID, SeedContext } from "./types";

const isPlaceholderUrl = (url: string): boolean => /example\.(org|com|net)|test\.invalid/i.test(url);

const asString = (value: unknown): string => (typeof value === "string" ? value : "");
const relId = (value: unknown): string =>
  value && typeof value === "object" && "id" in (value as Record<string, unknown>)
    ? String((value as { id: ID }).id)
    : value === null || value === undefined
      ? ""
      : String(value);

// Suggested association organizers to feature, in priority order.
const SUGGESTED_FEATURED = [
  "mustafa-matar",
  "mohammed-zakaria-al-hamad",
  "riman-yassin",
  "lamis-al-rahbi",
];

const KNOWN_PLACEHOLDERS = {
  associationNameAr: "جمعية الشعر العربي",
  associationNameEn: "Arab Poets Association",
  whatsapp: "+970000000000",
  email: "info@example.org",
};

export const seedGlobals = async (
  ctx: SeedContext,
  dataset: FacebookDataset,
): Promise<void> => {
  await seedSiteSettings(ctx, dataset);
  await seedHomepage(ctx, dataset);
};

const seedSiteSettings = async (ctx: SeedContext, dataset: FacebookDataset): Promise<void> => {
  const { payload, flags, report } = ctx;
  const data = dataset.siteSettings.data;

  const currentAr = await payload.findGlobal({ slug: "site-settings", locale: "ar", fallbackLocale: false, overrideAccess: true, depth: 0 });

  // Official email resolution (never invent a value).
  const envEmail = process.env.SEED_OFFICIAL_EMAIL?.trim();
  let officialEmail: string | undefined;
  if (isValidRealEmail(currentAr.officialEmail)) {
    report.officialEmail = { resolved: true, source: "existing", value: asString(currentAr.officialEmail) };
  } else if (isValidRealEmail(envEmail)) {
    officialEmail = envEmail;
    report.officialEmail = { resolved: true, source: "SEED_OFFICIAL_EMAIL", value: envEmail };
  } else {
    report.officialEmail = { resolved: false, source: "none", value: asString(currentAr.officialEmail) || undefined };
    report.warnings.push("Official email remains unresolved and requires client confirmation.");
  }

  // Track which known placeholders are being replaced.
  const replaced: string[] = [];
  if (asString(currentAr.associationName) === KNOWN_PLACEHOLDERS.associationNameAr) replaced.push("associationName");
  if (asString(currentAr.whatsapp) === KNOWN_PLACEHOLDERS.whatsapp) replaced.push("whatsapp");

  // Social links: seed the verified Facebook URL, preserve editor-approved
  // non-placeholder links, and drop placeholders. Do not add needs-review links.
  const verifiedFacebook = data.socialLinks.find(
    (link) => link.platform === "facebook" && link.verificationStatus === "verified",
  );
  const existingLinks = Array.isArray(currentAr.socialLinks) ? (currentAr.socialLinks as Record<string, unknown>[]) : [];
  const preservedOthers = existingLinks
    .filter((link) => asString(link.platform) !== "facebook" && !isPlaceholderUrl(asString(link.url)))
    .map((link) => ({ platform: asString(link.platform), url: asString(link.url) }));
  const hadPlaceholderSocial = existingLinks.some((link) => isPlaceholderUrl(asString(link.url)));
  if (hadPlaceholderSocial) replaced.push("socialLinks");
  const socialLinks = [
    ...(verifiedFacebook ? [{ platform: "facebook", url: verifiedFacebook.url }] : []),
    ...preservedOthers,
  ];

  const logo = resolveMedia(ctx, data.logoImageKey, "site-settings logo");
  const defaultSocialImage = resolveMedia(ctx, "arab-poetry-festival-7-teaser", "site-settings social image");

  const needsWrite =
    flags.updateExisting ||
    replaced.length > 0 ||
    !asString(currentAr.associationName) ||
    asString(currentAr.associationName) === KNOWN_PLACEHOLDERS.associationNameAr;

  if (logo !== undefined) replaced.push("logo");
  report.siteSettingsReplaced = [...new Set([...replaced, "associationName", "slogan", "whatsapp", "facebook"])];

  if (flags.dryRun || !needsWrite) return;

  const arData: Record<string, unknown> = {
    associationName: data.associationName.ar,
    slogan: data.slogan.ar,
    whatsapp: data.whatsapp,
    socialLinks,
  };
  if (logo !== undefined) arData.logo = logo;
  if (defaultSocialImage !== undefined) arData.defaultSocialImage = defaultSocialImage;
  if (officialEmail) arData.officialEmail = officialEmail;

  await payload.updateGlobal({ slug: "site-settings", locale: "ar", overrideAccess: true, data: arData });
  await payload.updateGlobal({
    slug: "site-settings",
    locale: "en",
    overrideAccess: true,
    data: { associationName: data.associationName.en, slogan: data.slogan.en },
  });
};

const seedHomepage = async (ctx: SeedContext, dataset: FacebookDataset): Promise<void> => {
  const { payload, flags } = ctx;

  // Featured people: published, in the public directory, with a local profile
  // image. Suggested organizers first, then any other eligible people.
  const eligible = dataset.people.records.filter(
    (p) =>
      ctx.peopleStatus.get(p.slug) === "published" &&
      p.showInPublicDirectory &&
      Boolean(p.profileImageKey),
  );
  const eligibleSlugs = new Set(eligible.map((p) => p.slug));
  const orderedSlugs = [
    ...SUGGESTED_FEATURED.filter((slug) => eligibleSlugs.has(slug)),
    ...eligible.map((p) => p.slug).filter((slug) => !SUGGESTED_FEATURED.includes(slug)),
  ].slice(0, 8);
  const featuredPeople = orderedSlugs
    .map((slug) => ctx.people.get(slug))
    .filter((id): id is ID => id !== undefined && !(typeof id === "string" && id.startsWith("dry:")));

  // Association team: published people carrying an organizing role.
  const teamPeople = dataset.people.records
    .filter(
      (p) =>
        ctx.peopleStatus.get(p.slug) === "published" &&
        p.showInPublicDirectory &&
        (p.roles ?? []).some((r) => r === "boardMember" || r === "teamMember"),
    )
    .map((p) => ctx.people.get(p.slug))
    .filter((id): id is ID => id !== undefined && !(typeof id === "string" && id.startsWith("dry:")));

  const featuredEvent = await findBySlug(payload, "events", HOMEPAGE_FEATURED_EVENT);
  if (flags.dryRun) return;

  const current = await payload.findGlobal({ slug: "homepage", locale: "ar", fallbackLocale: false, overrideAccess: true, draft: true, depth: 0 });

  const intended = {
    heroMode: "featuredEvent",
    featuredEvent: featuredEvent ? featuredEvent.id : undefined,
    featuredPeople,
    associationTeam: teamPeople,
    selectedPartners: [] as ID[],
    showNews: false,
  };

  const currentSig = JSON.stringify({
    heroMode: asString(current.heroMode),
    featuredEvent: relId(current.featuredEvent),
    featuredPeople: (Array.isArray(current.featuredPeople) ? current.featuredPeople : []).map(relId).sort(),
    associationTeam: (Array.isArray(current.associationTeam) ? current.associationTeam : []).map(relId).sort(),
    selectedPartners: (Array.isArray(current.selectedPartners) ? current.selectedPartners : []).map(relId).sort(),
  });
  const intendedSig = JSON.stringify({
    heroMode: intended.heroMode,
    featuredEvent: relId(intended.featuredEvent),
    featuredPeople: intended.featuredPeople.map(relId).sort(),
    associationTeam: intended.associationTeam.map(relId).sort(),
    selectedPartners: [] as string[],
  });

  const isPublished = asString(current._status) === "published";
  if (!flags.updateExisting && current.featuredEvent && currentSig === intendedSig && isPublished) return;
  if (currentSig === intendedSig && isPublished) return;

  await payload.updateGlobal({
    slug: "homepage",
    locale: "ar",
    overrideAccess: true,
    draft: false,
    data: { _status: "published", ...intended },
  });
  await payload.updateGlobal({
    slug: "homepage",
    locale: "en",
    overrideAccess: true,
    draft: false,
    data: { _status: "published" },
  });
};
