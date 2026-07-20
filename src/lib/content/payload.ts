import config from "@payload-config";
import type { Locale } from "@/i18n/config";
import { getPayload } from "payload";
import type { Config as GeneratedConfig } from "@/payload-types";
import type {
  Event,
  GalleryItem,
  HomepageSettings,
  LiteraryWork,
  LocalizedText,
  MediaAsset,
  Partner,
  Person,
  ProgramItem,
  SiteSettings,
  SocialLink,
} from "./types";

type Doc = Record<string, unknown>;
type CollectionSlug = keyof GeneratedConfig["collections"];
type GlobalSlug = keyof GeneratedConfig["globals"];

const asDoc = (value: unknown): Doc | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Doc) : null;

const asDocs = (value: unknown): Doc[] =>
  Array.isArray(value)
    ? value.map(asDoc).filter((item): item is Doc => Boolean(item))
    : [];

const asString = (value: unknown): string => (typeof value === "string" ? value : "");
const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" ? value : undefined;

const relationID = (value: unknown): string => {
  const relation = asDoc(value);
  return String(relation?.id ?? value ?? "");
};

const relationField = (value: unknown, field: string): unknown => asDoc(value)?.[field];

const richTextToString = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value;

  const walk = (node: unknown): string => {
    const document = asDoc(node);
    if (!document) return "";

    const ownText = asString(document.text);
    const children = asDocs(document.children).map(walk).filter(Boolean);
    const nodeType = asString(document.type);
    const separator = ["paragraph", "heading", "quote", "listitem"].includes(nodeType)
      ? "\n"
      : " ";

    return [ownText, children.join(separator)].filter(Boolean).join(ownText ? " " : "");
  };

  return walk(value)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
};

const sanitizeMediaURL = (value: unknown): string => {
  const raw = asString(value);
  if (!raw) return "";

  try {
    const url = new URL(raw);
    url.searchParams.delete("prefix");
    return url.toString();
  } catch {
    return raw.replace(/([?&])prefix=[^&]*(&?)/g, (_match, separator, trailing) =>
      separator === "?" && trailing ? "?" : "",
    );
  }
};

const mediaURL = (value: unknown): string =>
  sanitizeMediaURL(relationField(value, "cloudinarySecureUrl")) ||
  sanitizeMediaURL(relationField(value, "url"));

const localized = (arabic: unknown, english: unknown): LocalizedText => {
  const ar = asString(arabic);
  const en = asString(english) || ar;
  return { ar, en };
};

const mediaAsset = (
  arabicMedia: unknown,
  englishMedia: unknown,
  fallbackURL: string,
  fallbackAlt: LocalizedText,
): MediaAsset => ({
  url: mediaURL(arabicMedia) || mediaURL(englishMedia) || fallbackURL,
  alt: {
    ar: asString(relationField(arabicMedia, "alt")) || fallbackAlt.ar,
    en:
      asString(relationField(englishMedia, "alt")) ||
      asString(relationField(arabicMedia, "alt")) ||
      fallbackAlt.en,
  },
  caption:
    relationField(arabicMedia, "caption") || relationField(englishMedia, "caption")
      ? localized(
          relationField(arabicMedia, "caption"),
          relationField(englishMedia, "caption"),
        )
      : undefined,
  credit:
    asString(relationField(arabicMedia, "credit")) ||
    asString(relationField(englishMedia, "credit")) ||
    undefined,
});

const roleLabels: Record<string, [string, string]> = {
  poet: ["شاعر", "Poet"],
  writer: ["كاتب", "Writer"],
  critic: ["ناقد", "Critic"],
  artist: ["فنان", "Artist"],
  media: ["إعلامي", "Media professional"],
  presenter: ["مقدم", "Presenter"],
  guest: ["ضيف", "Guest"],
  boardMember: ["عضو إدارة", "Board member"],
  teamMember: ["عضو فريق", "Team member"],
  judge: ["عضو لجنة تحكيم", "Judge"],
  honoree: ["مكرّم", "Honoree"],
};

const workTypeLabels: Record<string, [string, string]> = {
  poetryCollection: ["ديوان شعر", "Poetry collection"],
  book: ["كتاب", "Book"],
  poem: ["قصيدة", "Poem"],
  article: ["مقال", "Article"],
  audio: ["تسجيل صوتي", "Audio"],
  recitationVideo: ["فيديو إلقاء", "Recitation video"],
  interview: ["مقابلة", "Interview"],
  other: ["أخرى", "Other"],
};

const roleLabel = (roles: unknown): LocalizedText => {
  const values = (Array.isArray(roles) ? roles : [roles]).map(String).filter(Boolean);
  const labels = values.map((value) => roleLabels[value]).filter(Boolean);
  if (!labels.length) return { ar: "شاعر وأديب", en: "Poet and writer" };
  return {
    ar: labels.map((label) => label[0]).join("، "),
    en: labels.map((label) => label[1]).join(", "),
  };
};

const findDocuments = async (
  collection: CollectionSlug,
  locale: Locale,
  options: {
    where?: Record<string, unknown>;
    limit?: number;
    sort?: string;
    depth?: number;
    select?: Record<string, unknown>;
    populate?: Record<string, unknown>;
    pagination?: boolean;
  } = {},
): Promise<Doc[]> => {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection,
    locale,
    fallbackLocale: false,
    depth: options.depth ?? 1,
    limit: options.limit ?? 100,
    pagination: options.pagination ?? false,
    select: options.select as never,
    populate: options.populate as never,
    sort: options.sort as never,
    overrideAccess: false,
    draft: false,
    where: options.where as never,
  });

  return asDocs(result.docs);
};

const findGlobal = async (
  slug: GlobalSlug,
  locale: Locale,
  depth = 1,
): Promise<Doc> => {
  const payload = await getPayload({ config });
  return asDoc(
    await payload.findGlobal({
      slug,
      locale,
      fallbackLocale: false,
      depth,
      overrideAccess: false,
      draft: false,
    }),
  ) ?? {};
};

export const payloadReady = (): boolean =>
  process.env.CMS_USE_MOCK_CONTENT !== "true" &&
  Boolean(process.env.DATABASE_URL && process.env.PAYLOAD_SECRET);

const mapProgram = (
  arabicEvent: Doc,
  englishEvent: Doc,
  locale: Locale,
): ProgramItem[] => {
  const arabicDays = asDocs(arabicEvent.programDays);
  const englishDays = asDocs(englishEvent.programDays);
  const selectedDays = locale === "ar" ? arabicDays : englishDays;
  const arabicItems = arabicDays.flatMap((day) => asDocs(day.items));
  const englishItems = englishDays.flatMap((day) => asDocs(day.items));
  const arabicByID = new Map(
    arabicItems.map((item) => [String(item.id ?? ""), item]),
  );
  const englishByID = new Map(
    englishItems.map((item) => [String(item.id ?? ""), item]),
  );

  return selectedDays.flatMap((day) =>
    asDocs(day.items).map((selectedItem) => {
      const id = String(selectedItem.id ?? "");
      const arabicItem = arabicByID.get(id) ?? {};
      const englishItem = englishByID.get(id) ?? {};
      const baseItem = locale === "ar" ? arabicItem : englishItem;
      const duration = asNumber(baseItem.durationMinutes);

      return {
        time: asString(baseItem.startTime) || undefined,
        duration: duration ? String(duration) : undefined,
        title: localized(arabicItem.title, englishItem.title),
        description:
          arabicItem.description || englishItem.description
            ? localized(arabicItem.description, englishItem.description)
            : undefined,
      };
    }),
  );
};

const eventStatus = (startDate: string, endDate?: string): Event["status"] => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate || startDate).getTime();
  const now = Date.now();

  if (!Number.isFinite(start)) return "past";
  if (now < start) return "upcoming";
  if (now <= end) return "ongoing";
  return "past";
};

const mapEvent = (
  arabicEvent: Doc,
  englishEvent: Doc,
  locale: Locale,
): Event => {
  const baseEvent = locale === "ar" ? arabicEvent : englishEvent;
  const startDate = asString(baseEvent.startDateTime);
  const endDate = asString(baseEvent.endDateTime);
  const attendance = asString(baseEvent.attendanceMode);
  const title = localized(arabicEvent.title, englishEvent.title);
  const arabicGallery = new Map(
    asDocs(arabicEvent.gallery).map((item) => [relationID(item), item]),
  );
  const englishGallery = new Map(
    asDocs(englishEvent.gallery).map((item) => [relationID(item), item]),
  );
  const selectedGallery = locale === "ar"
    ? asDocs(arabicEvent.gallery)
    : asDocs(englishEvent.gallery);

  const participantSlugs = asDocs(baseEvent.participants)
    .map((participant) => asString(relationField(participant.person, "slug")))
    .filter(Boolean);

  return {
    slug: asString(baseEvent.slug),
    status: eventStatus(startDate, endDate),
    title,
    type: localized(
      relationField(arabicEvent.eventType, "name"),
      relationField(englishEvent.eventType, "name"),
    ),
    typeSlug:
      asString(relationField(baseEvent.eventType, "slug")) ||
      relationID(baseEvent.eventType) ||
      undefined,
    typeColor:
      asString(relationField(baseEvent.eventType, "calendarColor")) || undefined,
    typeShowInLegend: relationField(baseEvent.eventType, "showInCalendarLegend") !== false,
    series:
      relationField(arabicEvent.series, "name") || relationField(englishEvent.series, "name")
        ? localized(
            relationField(arabicEvent.series, "name"),
            relationField(englishEvent.series, "name"),
          )
        : undefined,
    shortDescription: localized(
      arabicEvent.shortDescription,
      englishEvent.shortDescription,
    ),
    fullDescription: localized(
      richTextToString(arabicEvent.fullDescription),
      richTextToString(englishEvent.fullDescription),
    ),
    startDate,
    endDate: endDate || undefined,
    timezone: asString(baseEvent.timezone),
    country: localized(
      relationField(arabicEvent.country, "name"),
      relationField(englishEvent.country, "name"),
    ),
    city: localized(
      relationField(arabicEvent.city, "name"),
      relationField(englishEvent.city, "name"),
    ),
    venue:
      arabicEvent.venueName || englishEvent.venueName
        ? localized(arabicEvent.venueName, englishEvent.venueName)
        : undefined,
    attendance:
      attendance === "invitation" || attendance === "requestApproval"
        ? attendance
        : "open",
    image: mediaAsset(
      arabicEvent.coverImage,
      englishEvent.coverImage,
      "/images/istanbul-event.png",
      title,
    ),
    featured: Boolean(baseEvent.featuredOnHomepage),
    participantSlugs,
    program: mapProgram(arabicEvent, englishEvent, locale),
    youtubeUrl: asString(baseEvent.youtubeUrl) || undefined,
    gallery: selectedGallery
      .map((item) => {
        const id = relationID(item);
        return mediaAsset(
          arabicGallery.get(id),
          englishGallery.get(id),
          "",
          title,
        );
      })
      .filter((asset) => Boolean(asset.url)),
  };
};

export async function loadEvents(locale: Locale = "ar"): Promise<Event[]> {
  const documents = await findDocuments("events", locale, {
    limit: 200,
    sort: "startDateTime",
    depth: 1,
    select: {
      slug: true,
      title: true,
      eventType: true,
      series: true,
      shortDescription: true,
      startDateTime: true,
      endDateTime: true,
      timezone: true,
      country: true,
      city: true,
      venueName: true,
      attendanceMode: true,
      coverImage: true,
      featuredOnHomepage: true,
    },
  });

  return documents.map((document) => mapEvent(document, document, locale));
}

export async function loadGalleryItems(locale: Locale = "ar"): Promise<GalleryItem[]> {
  const documents = await findDocuments("events", locale, {
    limit: 200,
    sort: "-startDateTime",
    depth: 1,
    select: {
      slug: true,
      title: true,
      startDateTime: true,
      city: true,
      gallery: true,
    },
  });

  return documents.flatMap((event) => {
    const title = localized(event.title, event.title);
    const location = localized(
      relationField(event.city, "name"),
      relationField(event.city, "name"),
    );
    return asDocs(event.gallery)
      .map((item) => ({
        ...mediaAsset(item, item, "", title),
        eventSlug: asString(event.slug) || undefined,
        eventTitle: title,
        eventDate: asString(event.startDateTime) || undefined,
        eventLocation: location,
      }))
      .filter((item) => Boolean(item.url));
  });
}

export async function loadEventBySlug(
  slug: string,
  locale: Locale = "ar",
): Promise<Event | null> {
  const documents = await findDocuments("events", locale, {
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  });
  const document = documents[0];
  return document ? mapEvent(document, document, locale) : null;
}

const mapPerson = ({
  arabicPerson,
  englishPerson,
  arabicWorks,
  englishWorks,
  locale,
  events = [],
}: {
  arabicPerson: Doc;
  englishPerson: Doc;
  arabicWorks: Doc[];
  englishWorks: Doc[];
  locale: Locale;
  events?: Doc[];
}): Person => {
  const basePerson = locale === "ar" ? arabicPerson : englishPerson;
  const personID = String(basePerson.id);
  const arabicWorksByID = new Map(
    arabicWorks.map((work) => [String(work.id), work]),
  );
  const englishWorksByID = new Map(
    englishWorks.map((work) => [String(work.id), work]),
  );
  const selectedWorks = locale === "ar" ? arabicWorks : englishWorks;

  const works: LiteraryWork[] = selectedWorks
    .filter((work) => relationID(work.person) === personID)
    .map((selectedWork) => {
      const id = String(selectedWork.id);
      const arabicWork = arabicWorksByID.get(id) ?? {};
      const englishWork = englishWorksByID.get(id) ?? {};
      const baseWork = locale === "ar" ? arabicWork : englishWork;
      const type = workTypeLabels[asString(baseWork.type)] ?? ["أخرى", "Other"];
      return {
        title: localized(arabicWork.title, englishWork.title),
        type: { ar: type[0], en: type[1] },
        year: asNumber(baseWork.publicationYear),
        externalUrl: asString(baseWork.externalUrl) || undefined,
      };
    });

  const eventSlugs = events
    .filter((event) =>
      asDocs(event.participants).some(
        (participant) => relationID(participant.person) === personID,
      ),
    )
    .map((event) => asString(event.slug))
    .filter(Boolean);

  const name = asString(arabicPerson.name) || asString(englishPerson.name);
  const englishName = asString(englishPerson.name) || name;
  const initialsAr =
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .filter(Boolean)
      .join(".") || "ش";
  const initialsEn =
    englishName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .filter(Boolean)
      .join("") || initialsAr;
  const localizedName = localized(arabicPerson.name, englishPerson.name);

  return {
    slug: asString(basePerson.slug),
    name: localizedName,
    country: localized(
      relationField(arabicPerson.country, "name"),
      relationField(englishPerson.country, "name"),
    ),
    role: roleLabel(basePerson.roles),
    initials: { ar: initialsAr, en: initialsEn },
    image:
      mediaURL(arabicPerson.profileImage) || mediaURL(englishPerson.profileImage)
        ? mediaAsset(
            arabicPerson.profileImage,
            englishPerson.profileImage,
            "",
            localizedName,
          )
        : undefined,
    visible: Boolean(basePerson.showInPublicDirectory),
    shortBio: localized(arabicPerson.shortBio, englishPerson.shortBio),
    fullBio: localized(
      richTextToString(arabicPerson.fullBio),
      richTextToString(englishPerson.fullBio),
    ),
    city: arabicPerson.city || englishPerson.city
      ? localized(
          relationField(arabicPerson.city, "name"),
          relationField(englishPerson.city, "name"),
        )
      : undefined,
    website: asString(basePerson.website) || undefined,
    works,
    eventSlugs,
  };
};

export async function loadPeople(
  locale: Locale = "ar",
  slugs?: string[],
): Promise<Person[]> {
  const where = slugs?.length ? { slug: { in: slugs } } : undefined;
  const documents = await findDocuments("people", locale, {
    where,
    limit: 200,
    sort: "displayOrder",
    depth: 1,
  });

  return documents.map((document) =>
    mapPerson({
      arabicPerson: document,
      englishPerson: document,
      arabicWorks: [],
      englishWorks: [],
      locale,
    }),
  );
}

export async function loadPersonBySlug(
  slug: string,
  locale: Locale = "ar",
): Promise<Person | null> {
  const people = await findDocuments("people", locale, {
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  });
  const person = people[0];
  if (!person) return null;

  const [works, appearances] = await Promise.all([
    findDocuments("literary-works", locale, {
      where: { person: { equals: String(person.id) } },
      limit: 200,
      sort: "order",
      depth: 0,
    }),
    findDocuments("events", locale, {
      where: { "participants.person": { equals: String(person.id) } },
      limit: 200,
      sort: "-startDateTime",
      depth: 0,
      select: { slug: true, participants: true },
    }),
  ]);

  return mapPerson({
    arabicPerson: person,
    englishPerson: person,
    arabicWorks: works,
    englishWorks: works,
    locale,
    events: appearances,
  });
}


export async function loadPartnersBySlugs(
  slugs: string[],
  locale: Locale = "ar",
): Promise<Partner[]> {
  if (!slugs.length) return [];
  const documents = await findDocuments("partners", locale, {
    where: { slug: { in: slugs }, isActive: { equals: true } },
    limit: slugs.length,
    sort: "order",
    depth: 1,
    select: {
      slug: true,
      name: true,
      logo: true,
      website: true,
      relationshipType: true,
      isActive: true,
      order: true,
    },
  });

  const bySlug = new Map(
    documents.map((document) => {
      const name = localized(document.name, document.name);
      const partner: Partner = {
        slug: asString(document.slug),
        name,
        website: asString(document.website) || undefined,
        relationshipType: asString(document.relationshipType) || undefined,
        logo: mediaURL(document.logo)
          ? mediaAsset(document.logo, document.logo, "", name)
          : undefined,
      };
      return [partner.slug, partner] as const;
    }),
  );

  return slugs.map((slug) => bySlug.get(slug)).filter((item): item is Partner => Boolean(item));
}

export async function loadSiteSettings(locale: Locale = "ar"): Promise<SiteSettings> {
  const settings = await findGlobal("site-settings", locale);
  const associationName = localized(settings.associationName, settings.associationName);
  const socialLinks: SocialLink[] = asDocs(settings.socialLinks)
    .map((item) => ({
      platform: asString(item.platform) as SocialLink["platform"],
      url: asString(item.url),
    }))
    .filter((item) => Boolean(item.url));

  return {
    associationName,
    slogan: settings.slogan
      ? localized(settings.slogan, settings.slogan)
      : undefined,
    officialEmail: asString(settings.officialEmail) || undefined,
    whatsapp: asString(settings.whatsapp) || undefined,
    logo:
      mediaURL(settings.logo)
        ? mediaAsset(settings.logo, settings.logo, "/images/logo.png", associationName)
        : undefined,
    socialLinks,
  };
}

export async function loadHomepageSettings(
  locale: Locale = "ar",
): Promise<HomepageSettings> {
  const homepage = await findGlobal("homepage", locale);
  if (!homepage.id) return { heroMode: "automatic", featuredPeopleSlugs: [], selectedPartnerSlugs: [], associationTeamSlugs: [], statistics: [] };

  const hero = asDoc(homepage.institutionalHero) ?? {};
  const heroMode = asString(homepage.heroMode);

  const featuredPeopleSlugs = (Array.isArray(homepage.featuredPeople)
    ? homepage.featuredPeople
    : [])
    .map((person) => asString(relationField(person, "slug")))
    .filter(Boolean);
  const selectedPartnerSlugs = (Array.isArray(homepage.selectedPartners)
    ? homepage.selectedPartners
    : [])
    .map((partner) => asString(relationField(partner, "slug")))
    .filter(Boolean);
  const associationTeamSlugs = (Array.isArray(homepage.associationTeam)
    ? homepage.associationTeam
    : [])
    .map((person) => asString(relationField(person, "slug")))
    .filter(Boolean);
  const statistics = asDocs(homepage.statistics)
    .map((item) => ({
      value: asString(item.value),
      label: localized(item.label, item.label),
    }))
    .filter((item) => Boolean(item.value && item.label.ar));

  return {
    heroMode:
      heroMode === "featuredEvent" || heroMode === "institutional"
        ? heroMode
        : "automatic",
    featuredEventSlug:
      asString(relationField(homepage.featuredEvent, "slug")) || undefined,
    institutionalTitle: hero.title
      ? localized(hero.title, hero.title)
      : undefined,
    institutionalDescription: hero.description
      ? localized(hero.description, hero.description)
      : undefined,
    institutionalImage:
      mediaURL(hero.image)
        ? mediaAsset(
            hero.image,
            hero.image,
            "",
            localized(hero.title || "", hero.title || ""),
          )
        : undefined,
    featuredPeopleSlugs,
    selectedPartnerSlugs,
    associationTeamSlugs,
    statistics,
  };
}
