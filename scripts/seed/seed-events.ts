import { findBySlug, looksLikePlaceholder, reconcileStatus, tallyOutcome, toUtcISO, upsertLocalized } from "./helpers";
import { resolveMedia } from "./seed-media";
import type { EventRecord, FacebookDataset, Locale, ProgramDayRecord, SeedContext } from "./types";

// The event chosen to feature on the homepage. No future event is safely
// publishable (the only upcoming event is a needs-review draft), so a rich,
// verified, published archive edition is featured instead.
export const HOMEPAGE_FEATURED_EVENT = "arab-poetry-festival-seventh-istanbul-2025";

// Legacy fixture slug -> canonical dataset slug. Used to adopt old records in
// place (preserving their id) rather than creating avoidable duplicates.
const LEGACY_EVENT_MAP: Record<string, string> = {
  "arabic-poem-forum-istanbul-2026": "istanbul-poetry-forum-2026",
  "arab-poetry-festival-eighth-istanbul-2026": "arab-poetry-festival-eighth",
};

const VALID_ATTENDANCE = new Set(["open", "invitation", "requestApproval"]);
const VALID_PROGRAM_MODE = new Set(["single", "perDay", "sharedAcrossDays"]);

const deriveEventRole = (roles: string[] | undefined): string => {
  const set = new Set(roles ?? []);
  if (set.has("poet")) return "poet";
  if (set.has("presenter") || set.has("media")) return "presenter";
  if (set.has("boardMember") || set.has("teamMember")) return "organizer";
  if (set.has("judge")) return "judge";
  if (set.has("honoree")) return "honoree";
  return "guest";
};

const localizedDate = (value?: string | null): string | undefined =>
  value ? new Date(`${value}T00:00:00.000Z`).toISOString() : undefined;

type DocRow = { id?: unknown; items?: unknown };

// Build the localized programDays array for one locale. Non-localized fields
// (date, times, relationships) are identical across locales; localized text
// (label, title, description, venue) is swapped per locale.
//
// Payload stores one shared set of array rows with per-locale values for the
// localized subfields. To write the second locale correctly, the existing row
// ids must be supplied so Payload matches rows instead of treating them as new
// (which would leave the required localized fields empty). `existingDays` — the
// rows read back after the first-locale write — supplies those ids.
const buildProgramDays = (
  ctx: SeedContext,
  days: ProgramDayRecord[] | undefined,
  locale: Locale,
  existingDays?: DocRow[],
): Record<string, unknown>[] =>
  (days ?? []).map((day, dayIndex) => {
    const existingDay = existingDays?.[dayIndex];
    const existingItems = Array.isArray(existingDay?.items) ? (existingDay!.items as DocRow[]) : [];
    return {
      ...(existingDay?.id !== undefined ? { id: existingDay.id } : {}),
      label: day.label[locale],
      date: localizedDate(day.date),
      items: (day.items ?? []).map((item, itemIndex) => {
        const presenter = item.presenterSlug ? ctx.people.get(item.presenterSlug) : undefined;
        const participants = (item.participantSlugs ?? [])
          .map((slug) => ctx.people.get(slug))
          .filter((id): id is string | number => id !== undefined && !(typeof id === "string" && id.startsWith("dry:")));
        const existingItem = existingItems[itemIndex];
        const row: Record<string, unknown> = { title: item.title[locale] };
        if (existingItem?.id !== undefined) row.id = existingItem.id;
        if (item.startTime) row.startTime = item.startTime;
        if (item.durationMinutes) row.durationMinutes = item.durationMinutes;
        if (presenter !== undefined && !(typeof presenter === "string" && presenter.startsWith("dry:"))) {
          row.presenter = presenter;
        }
        if (participants.length) row.participants = participants;
        if (item.description) row.description = item.description[locale];
        if (item.venue) row.venue = item.venue[locale];
        return row;
      }),
    };
  });

const eventPublishable = (event: EventRecord): boolean => {
  const status = event.archive?.verificationStatus ?? event.verificationStatus;
  const hasTime = Boolean(event.startTimeLocal);
  // Unknown start time forces a draft even for verified events.
  return hasTime && (status === "verified" || status === "approvedWithGaps");
};

// Rename a legacy fixture to the canonical slug in place, preserving its id, so
// the subsequent upsert refreshes it with canonical content.
const adoptLegacyEvent = async (ctx: SeedContext, canonicalSlug: string): Promise<void> => {
  const legacySlug = LEGACY_EVENT_MAP[canonicalSlug];
  if (!legacySlug) return;
  const [legacy, canonical] = await Promise.all([
    findBySlug(ctx.payload, "events", legacySlug),
    findBySlug(ctx.payload, "events", canonicalSlug),
  ]);
  if (!legacy) return;

  if (!canonical) {
    if (!ctx.flags.dryRun) {
      // Clear programDays while renaming. The legacy fixture may carry an old
      // programDays block (whose localized subfields Payload now re-validates on
      // any write); the adopted events have no program in the new dataset, and
      // the subsequent upsert sets the canonical content regardless.
      await ctx.payload.update({
        collection: "events",
        id: legacy.id,
        locale: "ar",
        overrideAccess: true,
        data: { slug: canonicalSlug, programDays: [] },
      });
    }
    ctx.report.legacy.adopted.push(`${legacySlug} -> ${canonicalSlug}`);
    return;
  }

  // Both exist: keep both, update canonical downstream, and unpublish the old
  // fixture only when prune is enabled and it is positively a placeholder.
  ctx.report.legacy.conflicts.push(`${legacySlug} and ${canonicalSlug} both exist`);
  if (ctx.flags.pruneLegacyPlaceholders && looksLikePlaceholder(legacy) && !ctx.flags.dryRun) {
    await reconcileStatus(ctx.payload, "events", legacy.id, false);
    ctx.report.legacy.pruned.push(`${legacySlug} (unpublished old fixture)`);
  }
};

export const seedEvents = async (
  ctx: SeedContext,
  dataset: FacebookDataset,
): Promise<void> => {
  const { payload, flags, report } = ctx;
  const rolesBySlug = new Map(dataset.people.records.map((p) => [p.slug, p.roles ?? []]));

  for (const event of dataset.events.records) {
    await adoptLegacyEvent(ctx, event.slug);

    const eventType = ctx.eventTypes.get(event.eventTypeSlug);
    const country = ctx.countries.get(event.countrySlug);
    const city = event.citySlug ? ctx.cities.get(event.citySlug) : undefined;
    if (eventType === undefined || country === undefined) {
      report.errors.push(`Event ${event.slug}: unresolved event type or country`);
      continue;
    }

    const start = toUtcISO(event.startDate, event.startTimeLocal, event.timezone);
    const end = event.endDate ? toUtcISO(event.endDate, event.endTimeLocal, event.timezone) : undefined;
    const published = eventPublishable(event);

    // Participants: keep every referenced person as a relationship. Public
    // access control hides draft/undisplayed people automatically; we only
    // record which ones are omitted from the public view for the report.
    const participants: Record<string, unknown>[] = [];
    const omittedDraft: string[] = [];
    (event.participantSlugs ?? []).forEach((slug, index) => {
      const personId = ctx.people.get(slug);
      if (personId === undefined) {
        report.errors.push(`Event ${event.slug}: participant ${slug} not resolved`);
        return;
      }
      if (ctx.peopleStatus.get(slug) !== "published") omittedDraft.push(slug);
      if (typeof personId === "string" && personId.startsWith("dry:")) return;
      participants.push({ person: personId, eventRole: deriveEventRole(rolesBySlug.get(slug)), isFeatured: false, order: index + 1 });
    });
    if (published && omittedDraft.length) {
      report.events.omittedDraftParticipants[event.slug] = omittedDraft;
    }

    const gallery = (event.galleryImageKeys ?? [])
      .map((key) => resolveMedia(ctx, key, `event ${event.slug} gallery`))
      .filter((id): id is string | number => id !== undefined);

    const attendanceMode = VALID_ATTENDANCE.has(event.attendanceMode ?? "")
      ? event.attendanceMode
      : "open";
    const programMode = VALID_PROGRAM_MODE.has(event.programMode ?? "")
      ? event.programMode
      : (event.programDays?.length ?? 0) > 1
        ? "perDay"
        : "single";

    // Archive: preserve source + verification, annotate an unconfirmed time.
    const notes: string[] = [];
    if (event.archive?.verificationNotes) notes.push(event.archive.verificationNotes);
    if (start.timeAssumed) {
      notes.push(
        "Start time is not printed in the source; normalized to a technical placeholder (local noon) and kept as a draft pending confirmation.",
      );
    }
    const archive = {
      sourceFacebookUrl: event.archive?.sourceFacebookUrl,
      verificationStatus: event.archive?.verificationStatus ?? event.verificationStatus ?? "needsReview",
      verificationNotes: notes.join(" ") || undefined,
    };

    const common: Record<string, unknown> = {
      eventType,
      country,
      editionNumber: event.editionNumber,
      featuredOnHomepage: event.slug === HOMEPAGE_FEATURED_EVENT,
      startDateTime: start.iso,
      timezone: event.timezone,
      attendanceMode,
      participants,
      programMode,
      gallery,
      archive,
    };
    if (city !== undefined) common.city = city;
    // Only set an end when it is strictly after the start. A single-day event
    // whose end time is unknown would otherwise normalize to a placeholder that
    // can fall before the start; endDateTime is optional, so omit it instead of
    // inventing an end earlier than the start.
    if (end && new Date(end.iso).getTime() > new Date(start.iso).getTime()) {
      common.endDateTime = end.iso;
    }
    const cover = resolveMedia(ctx, event.coverImageKey, `event ${event.slug} cover`);
    const social = resolveMedia(ctx, event.socialImageKey, `event ${event.slug} social`);
    const poster = resolveMedia(ctx, event.posterImageKey, `event ${event.slug} poster`);
    if (cover !== undefined) common.coverImage = cover;
    if (social !== undefined) common.socialImage = social;
    if (poster !== undefined) common.posterImage = poster;

    if (published) report.events.published += 1;
    else report.events.drafts += 1;

    if (flags.dryRun) continue;

    // programDays is written only in the AR block here (establishing the shared
    // rows). English values for its localized subfields are applied afterwards,
    // matched to the freshly-generated row ids, to avoid Payload leaving the
    // required localized fields empty on the second-locale write.
    const { doc, outcome } = await upsertLocalized(payload, flags, {
      collection: "events",
      slug: event.slug,
      common,
      ar: {
        title: event.title.ar,
        shortDescription: event.shortDescription.ar,
        venueName: event.venueName?.ar,
        addressText: event.addressText?.ar,
        programDays: buildProgramDays(ctx, event.programDays, "ar"),
      },
      en: {
        title: event.title.en,
        shortDescription: event.shortDescription.en,
        venueName: event.venueName?.en,
        addressText: event.addressText?.en,
      },
      versioned: true,
      published,
    });
    tallyOutcome(report.events, outcome);

    if (outcome !== "unchanged" && (event.programDays?.length ?? 0) > 0) {
      await applyEnglishProgramDays(ctx, doc.id, event, published);
    }
  }
};

// Fill the English localized values of an event's programDays, matched to the
// row ids Payload generated during the AR write. Runs only after a real write.
const applyEnglishProgramDays = async (
  ctx: SeedContext,
  eventId: string | number,
  event: EventRecord,
  published: boolean,
): Promise<void> => {
  const fresh = await ctx.payload.findByID({
    collection: "events",
    id: eventId,
    locale: "ar",
    fallbackLocale: false,
    depth: 0,
    overrideAccess: true,
    draft: true,
  });
  const existingDays = Array.isArray(fresh.programDays)
    ? (fresh.programDays as DocRow[])
    : [];
  await ctx.payload.update({
    collection: "events",
    id: eventId,
    locale: "en",
    overrideAccess: true,
    draft: !published,
    data: { programDays: buildProgramDays(ctx, event.programDays, "en", existingDays) },
  });
};
