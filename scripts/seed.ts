import dotenv from "dotenv";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(projectRoot, ".env.local") });
dotenv.config({ path: path.join(projectRoot, ".env") });

type ID = number | string;
type SeedDocument = {
  id: ID;
  slug?: string;
  filename?: string;
  internalSeedKey?: string | null;
};
type SeedPayload = {
  find: (args: Record<string, unknown>) => Promise<{ docs: SeedDocument[]; totalDocs: number }>;
  findGlobal: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
  create: (args: Record<string, unknown>) => Promise<SeedDocument>;
  update: (args: Record<string, unknown>) => Promise<SeedDocument>;
  updateGlobal: (args: Record<string, unknown>) => Promise<unknown>;
};

const { default: config } = await import("../src/payload.config");
const payload = (await getPayload({ config })) as unknown as SeedPayload;
const updateExisting = process.env.SEED_UPDATE_EXISTING === "true";

const richText = (text: string) => ({
  root: {
    type: "root",
    format: "",
    indent: 0,
    version: 1,
    direction: "rtl",
    children: [
      {
        type: "paragraph",
        format: "",
        indent: 0,
        version: 1,
        direction: "rtl",
        children: [
          {
            type: "text",
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text,
            version: 1,
          },
        ],
      },
    ],
  },
});

const findBySlug = async (collection: string, slug: string) => {
  const result = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    draft: true,
  });
  return result.docs[0];
};

// Reconcile only the localized publication status of an existing record when it
// differs from the intended fixture. An upgraded database can carry a status
// that a previous version left behind (e.g. a fixture draft that was published
// earlier), and the idempotent read-only path below would otherwise never fix
// it. Writing only on a genuine difference keeps a steady-state seed from
// creating new versions.
const reconcileStatus = async (
  collection: string,
  id: ID,
  published: boolean,
): Promise<void> => {
  for (const locale of ["ar", "en"] as const) {
    // Read the LIVE published state for this locale (draft: false returns a doc
    // only when it is actually published). The latest draft version's status is
    // not a reliable signal — a document can carry a draft version while its
    // published projection is still live.
    const live = await payload.find({
      collection,
      locale,
      fallbackLocale: false,
      where: { id: { equals: id } },
      limit: 1,
      depth: 0,
      // overrideAccess must stay false: it mirrors real public visibility, so an
      // unpublished document is correctly reported as not published. With
      // overrideAccess: true, draft-only documents leak through a draft: false
      // read and the status would be rewritten on every run.
      overrideAccess: false,
      draft: false,
    });
    const isPublished = live.totalDocs === 1;
    if (isPublished !== published) {
      // Drive the live publication status directly through `_status` (no `draft`
      // flag): passing `draft: true` would only stash a draft version while the
      // published document stayed visible. This unpublishes/publishes for real.
      await payload.update({
        collection,
        id,
        locale,
        overrideAccess: true,
        data: { _status: published ? "published" : "draft" },
      });
    }
  }
};

const upsertLocalized = async ({
  collection,
  slug,
  common,
  ar,
  en,
  drafts = false,
  published = true,
}: {
  collection: string;
  slug: string;
  common?: Record<string, unknown>;
  ar: Record<string, unknown>;
  en: Record<string, unknown>;
  drafts?: boolean;
  published?: boolean;
}): Promise<SeedDocument> => {
  const existing = await findBySlug(collection, slug);

  // A normal second seed run is intentionally read-only for existing content.
  // This prevents autosave/version history from growing on every verification run.
  // The publication status is still reconciled, but only when it actually
  // differs from the fixture, so a steady-state seed creates no new versions.
  if (existing && !updateExisting) {
    if (drafts) await reconcileStatus(collection, existing.id, published);
    return existing;
  }

  const arabicData = {
    ...common,
    ...ar,
    slug,
    ...(drafts ? { _status: published ? "published" : "draft" } : {}),
  };

  const document = existing
    ? await payload.update({
        collection,
        id: existing.id,
        locale: "ar",
        overrideAccess: true,
        ...(drafts ? { draft: !published } : {}),
        data: arabicData,
      })
    : await payload.create({
        collection,
        locale: "ar",
        overrideAccess: true,
        ...(drafts ? { draft: !published } : {}),
        data: arabicData,
      });

  await payload.update({
    collection,
    id: document.id,
    locale: "en",
    overrideAccess: true,
    ...(drafts ? { draft: !published } : {}),
    data: {
      ...en,
      ...(drafts ? { _status: published ? "published" : "draft" } : {}),
    },
  });

  return document;
};

const uploadMedia = async ({
  filename,
  altAr,
  altEn,
  captionAr,
  captionEn,
}: {
  filename: string;
  altAr: string;
  altEn: string;
  captionAr?: string;
  captionEn?: string;
}): Promise<SeedDocument> => {
  const internalSeedKey = `seed-media:${filename}`;
  const keyedResult = await payload.find({
    collection: "media",
    where: { internalSeedKey: { equals: internalSeedKey } },
    limit: 2,
    depth: 0,
    overrideAccess: true,
    locale: "ar",
  });
  let document = keyedResult.docs[0];

  // v0.3 stored Cloudinary's randomized filename instead of the source name.
  // Reconcile those existing records by their stable Arabic alt text once.
  if (!document) {
    const legacyResult = await payload.find({
      collection: "media",
      where: { alt: { equals: altAr } },
      sort: "-createdAt",
      limit: 20,
      depth: 0,
      overrideAccess: true,
      locale: "ar",
    });
    document = legacyResult.docs[0];
    if (legacyResult.totalDocs > 1) {
      console.warn(
        `Found ${legacyResult.totalDocs} legacy copies for ${filename}; the newest was adopted. ` +
          "Older duplicates were left untouched for safe manual review.",
      );
    }
  }

  if (!document) {
    const filePath = path.join(projectRoot, "public", "images", filename);
    const data = await readFile(filePath);
    const extension = path.extname(filename).slice(1).toLowerCase();
    const mimetype = extension === "jpg" || extension === "jpeg"
      ? "image/jpeg"
      : `image/${extension}`;
    document = await payload.create({
      collection: "media",
      locale: "ar",
      overrideAccess: true,
      data: { internalSeedKey, alt: altAr, caption: captionAr },
      file: { data, mimetype, name: filename, size: data.byteLength },
    });
  } else {
    document = await payload.update({
      collection: "media",
      id: document.id,
      locale: "ar",
      overrideAccess: true,
      data: { internalSeedKey, alt: altAr, caption: captionAr },
    });
  }

  await payload.update({
    collection: "media",
    id: document.id,
    locale: "en",
    overrideAccess: true,
    data: { alt: altEn, caption: captionEn },
  });
  return document;
};

console.log("Seeding taxonomies...");
const forum = await upsertLocalized({
  collection: "event-types",
  slug: "forum",
  common: { isActive: true, order: 1 },
  ar: { name: "ملتقى" },
  en: { name: "Forum" },
});
const festival = await upsertLocalized({
  collection: "event-types",
  slug: "festival",
  common: { isActive: true, order: 2 },
  ar: { name: "مهرجان" },
  en: { name: "Festival" },
});
const evening = await upsertLocalized({
  collection: "event-types",
  slug: "poetry-evening",
  common: { isActive: true, order: 3 },
  ar: { name: "أمسية شعرية" },
  en: { name: "Poetry evening" },
});

const palestine = await upsertLocalized({
  collection: "countries",
  slug: "palestine",
  common: { isActive: true, order: 1 },
  ar: { name: "فلسطين" },
  en: { name: "Palestine" },
});
const turkey = await upsertLocalized({
  collection: "countries",
  slug: "turkey",
  common: { isActive: true, order: 2 },
  ar: { name: "تركيا" },
  en: { name: "Türkiye" },
});
const egypt = await upsertLocalized({
  collection: "countries",
  slug: "egypt",
  common: { isActive: true, order: 3 },
  ar: { name: "مصر" },
  en: { name: "Egypt" },
});
const jordan = await upsertLocalized({
  collection: "countries",
  slug: "jordan",
  common: { isActive: true, order: 4 },
  ar: { name: "الأردن" },
  en: { name: "Jordan" },
});

const gaza = await upsertLocalized({
  collection: "cities",
  slug: "gaza",
  common: { country: palestine.id, isActive: true, order: 1 },
  ar: { name: "غزة" },
  en: { name: "Gaza" },
});
const istanbul = await upsertLocalized({
  collection: "cities",
  slug: "istanbul",
  common: { country: turkey.id, isActive: true, order: 2 },
  ar: { name: "إسطنبول" },
  en: { name: "Istanbul" },
});
const cairo = await upsertLocalized({
  collection: "cities",
  slug: "cairo",
  common: { country: egypt.id, isActive: true, order: 3 },
  ar: { name: "القاهرة" },
  en: { name: "Cairo" },
});
const amman = await upsertLocalized({
  collection: "cities",
  slug: "amman",
  common: { country: jordan.id, isActive: true, order: 4 },
  ar: { name: "عمّان" },
  en: { name: "Amman" },
});

console.log("Uploading seed media...");
const logo = await uploadMedia({
  filename: "logo.png",
  altAr: "شعار جمعية الشعر العربي",
  altEn: "Arab Poets Association logo",
});
const istanbulImage = await uploadMedia({
  filename: "istanbul-event.png",
  altAr: "مشهد لفعالية شعرية في إسطنبول",
  altEn: "Arabic poetry event in Istanbul",
  captionAr: "صورة تجريبية لملتقى القصيدة العربية.",
  captionEn: "Sample image for the Arabic Poem Forum.",
});
const posterImage = await uploadMedia({
  filename: "poets-poster.png",
  altAr: "ملصق فعالية شعرية",
  altEn: "Poetry event poster",
});
const eventSquareImage = await uploadMedia({
  filename: "event-square.png",
  altAr: "جمهور في أمسية شعرية",
  altEn: "Audience at a poetry evening",
});
const associationImage = await uploadMedia({
  filename: "association-photo.png",
  altAr: "فريق جمعية الشعر العربي",
  altEn: "Arab Poets Association team",
});

console.log("Seeding series and people...");
const forumSeries = await upsertLocalized({
  collection: "event-series",
  slug: "arabic-poem-forum",
  common: { logo: logo.id, coverImage: istanbulImage.id },
  ar: {
    name: "ملتقى القصيدة العربية",
    description: "سلسلة ملتقيات دولية تجمع الشعراء والجمهور والمؤسسات الثقافية.",
  },
  en: {
    name: "Arabic Poem Forum",
    description: "An international forum series connecting poets, audiences, and cultural institutions.",
  },
  drafts: true,
});

const mustafa = await upsertLocalized({
  collection: "people",
  slug: "mustafa-matar",
  common: {
    country: palestine.id,
    city: gaza.id,
    profileImage: associationImage.id,
    roles: ["poet", "writer"],
    website: "https://example.org/mustafa-matar",
    showContactPublicly: false,
    showInPublicDirectory: true,
    displayOrder: 1,
  },
  ar: {
    name: "مصطفى مطر",
    shortBio: "شاعر وكاتب فلسطيني يشارك في ملتقيات وأمسيات عربية.",
    fullBio: richText("يهتم بالشعر العربي المعاصر وبناء الجسور الثقافية بين الشعراء والجمهور، وله مشاركات في مهرجانات وملتقيات عربية ودولية."),
  },
  en: {
    name: "Mustafa Matar",
    shortBio: "A Palestinian poet and writer active in Arab literary forums and readings.",
    fullBio: richText("His work explores contemporary Arabic poetry and cultural exchange between poets and audiences, with appearances at Arab and international festivals."),
  },
  drafts: true,
});

const ibtisam = await upsertLocalized({
  collection: "people",
  slug: "ibtisam-al-samadi",
  common: {
    country: jordan.id,
    city: amman.id,
    roles: ["poet"],
    showContactPublicly: false,
    showInPublicDirectory: true,
    displayOrder: 2,
  },
  ar: {
    name: "ابتسام الصمادي",
    shortBio: "شاعرة عربية مشاركة في فعاليات ومهرجانات أدبية.",
    fullBio: richText("تكتب القصيدة العربية الحديثة وتشارك في برامج ثقافية تهتم بالتبادل الأدبي بين الأجيال والمدن."),
  },
  en: {
    name: "Ibtisam Al-Samadi",
    shortBio: "An Arab poet participating in literary festivals and cultural events.",
    fullBio: richText("She writes contemporary Arabic poetry and joins cultural programs focused on literary exchange across generations and cities."),
  },
  drafts: true,
});

const hassan = await upsertLocalized({
  collection: "people",
  slug: "hassan-talab",
  common: {
    country: egypt.id,
    city: cairo.id,
    roles: ["poet", "critic"],
    showContactPublicly: false,
    showInPublicDirectory: true,
    displayOrder: 3,
  },
  ar: {
    name: "حسن طلب",
    shortBio: "شاعر وناقد مصري وضيف في برامج ثقافية متعددة.",
    fullBio: richText("له حضور في المشهد الشعري العربي ومشاركات في أمسيات وندوات ثقافية تناقش تحولات القصيدة الحديثة."),
  },
  en: {
    name: "Hassan Talab",
    shortBio: "An Egyptian poet and critic featured in cultural programs.",
    fullBio: richText("He is active in the Arab poetry scene and participates in readings and seminars discussing the evolution of modern poetry."),
  },
  drafts: true,
});

const khaled = await upsertLocalized({
  collection: "people",
  slug: "khaled-al-yasari",
  common: {
    country: turkey.id,
    city: istanbul.id,
    roles: ["media", "presenter"],
    showContactPublicly: false,
    showInPublicDirectory: true,
    displayOrder: 4,
  },
  ar: {
    name: "خالد اليساري",
    shortBio: "إعلامي ومقدم فعاليات ثقافية وشعرية.",
    fullBio: richText("يسهم في تقديم وإدارة الحوارات والفعاليات الثقافية والشعرية وربط الجمهور بالضيوف والمشاركين."),
  },
  en: {
    name: "Khaled Al-Yasari",
    shortBio: "A media professional and presenter of literary events.",
    fullBio: richText("He presents and moderates cultural and poetry events, connecting audiences with guests and participants."),
  },
  drafts: true,
});

await upsertLocalized({
  collection: "people",
  slug: "draft-poet-profile",
  common: {
    country: palestine.id,
    city: gaza.id,
    roles: ["poet"],
    showContactPublicly: false,
    showInPublicDirectory: false,
    displayOrder: 99,
  },
  ar: {
    name: "ملف شاعر قيد المراجعة",
    shortBio: "ملف تجريبي يجب ألا يظهر في الدليل العام.",
    fullBio: richText("هذا الملف مخصص لاختبار المسودات والصلاحيات داخل لوحة الإدارة."),
  },
  en: {
    name: "Draft Poet Profile",
    shortBio: "A test profile that must not appear in the public directory.",
    fullBio: richText("This profile is used to test drafts and access control in the admin panel."),
  },
  drafts: true,
  published: false,
});

console.log("Seeding literary works...");
await upsertLocalized({
  collection: "literary-works",
  slug: "at-the-edge-of-light",
  common: {
    person: mustafa.id,
    type: "poetryCollection",
    coverImage: posterImage.id,
    publicationYear: 2024,
    order: 1,
  },
  ar: { title: "على حافة الضوء", publisher: "دار القصيدة", description: "ديوان شعري تجريبي للاختبار." },
  en: { title: "At the Edge of Light", publisher: "Poem House", description: "A sample poetry collection for testing." },
  drafts: true,
});
await upsertLocalized({
  collection: "literary-works",
  slug: "memory-of-cities",
  common: { person: mustafa.id, type: "poem", publicationYear: 2025, order: 2 },
  ar: { title: "ذاكرة المدن", description: "قصيدة عن المكان والذاكرة." },
  en: { title: "Memory of Cities", description: "A poem about place and memory." },
  drafts: true,
});
await upsertLocalized({
  collection: "literary-works",
  slug: "modern-poetry-dialogue",
  common: {
    person: hassan.id,
    type: "interview",
    publicationYear: 2026,
    externalUrl: "https://example.org/interviews/modern-poetry",
    order: 1,
  },
  ar: { title: "حوار حول القصيدة الحديثة", description: "مقابلة ثقافية تجريبية." },
  en: { title: "A Dialogue on Modern Poetry", description: "A sample cultural interview." },
  drafts: true,
});

console.log("Seeding events...");
const upcomingEvent = await upsertLocalized({
  collection: "events",
  slug: "istanbul-poetry-forum-2026",
  common: {
    eventType: forum.id,
    series: forumSeries.id,
    editionNumber: 1,
    featuredOnHomepage: true,
    startDateTime: "2026-08-05T12:00:00.000Z",
    endDateTime: "2026-08-10T15:00:00.000Z",
    timezone: "Europe/Istanbul",
    country: turkey.id,
    city: istanbul.id,
    attendanceMode: "requestApproval",
    coverImage: istanbulImage.id,
    socialImage: istanbulImage.id,
    posterImage: posterImage.id,
    gallery: [associationImage.id, istanbulImage.id, posterImage.id],
    participants: [
      { person: mustafa.id, eventRole: "poet", isFeatured: true, order: 1 },
      { person: ibtisam.id, eventRole: "poet", isFeatured: true, order: 2 },
      { person: khaled.id, eventRole: "presenter", isFeatured: false, order: 3 },
    ],
    programMode: "perDay",
    programDays: [
      {
        label: "اليوم الأول",
        date: "2026-08-05T00:00:00.000Z",
        items: [
          { title: "الافتتاح", startTime: "15:00", durationMinutes: 15, presenter: khaled.id, description: "الترحيب بالمشاركين والجمهور." },
          { title: "الأمسية الشعرية", startTime: "15:15", durationMinutes: 90, participants: [mustafa.id, ibtisam.id], description: "قراءات شعرية بمشاركة شعراء من عدة دول." },
        ],
      },
    ],
  },
  ar: {
    title: "ملتقى القصيدة العربية في إسطنبول — الدورة الأولى",
    editionName: "الدورة الأولى",
    shortDescription: "ملتقى ثقافي دولي يجمع نخبة من الشعراء العرب ضمن برنامج من الأمسيات واللقاءات.",
    fullDescription: richText("تنظم الجمعية هذا الملتقى بوصفه مساحة للتفاعل الثقافي والتعريف بالتجارب الشعرية العربية. يجمع البرنامج بين القراءات الشعرية والحوارات الأدبية وفقرات التكريم."),
    venueName: "قاعة ثقافية في إسطنبول",
    addressText: "إسطنبول، تركيا",
    attendanceNote: "تتم مراجعة طلبات المشاركة قبل تأكيد الحضور.",
    programDays: [
      {
        label: "اليوم الأول",
        date: "2026-08-05T00:00:00.000Z",
        items: [
          { title: "الافتتاح", startTime: "15:00", durationMinutes: 15, presenter: khaled.id, description: "الترحيب بالمشاركين والجمهور." },
          { title: "الأمسية الشعرية", startTime: "15:15", durationMinutes: 90, participants: [mustafa.id, ibtisam.id], description: "قراءات شعرية بمشاركة شعراء من عدة دول." },
        ],
      },
    ],
  },
  en: {
    title: "Arabic Poem Forum in Istanbul — First Edition",
    editionName: "First edition",
    shortDescription: "An international cultural forum bringing Arab poets together for readings and conversations.",
    fullDescription: richText("The association organizes this forum as a space for cultural exchange and the presentation of Arab poetic experiences, combining readings, conversations, and recognition ceremonies."),
    venueName: "Cultural Hall in Istanbul",
    addressText: "Istanbul, Türkiye",
    attendanceNote: "Participation requests are reviewed before attendance is confirmed.",
    programDays: [
      {
        label: "Day one",
        date: "2026-08-05T00:00:00.000Z",
        items: [
          { title: "Opening", startTime: "15:00", durationMinutes: 15, presenter: khaled.id, description: "Welcome to participants and guests." },
          { title: "Poetry reading", startTime: "15:15", durationMinutes: 90, participants: [mustafa.id, ibtisam.id], description: "Poetry readings by participants from several countries." },
        ],
      },
    ],
  },
  drafts: true,
});

await upsertLocalized({
  collection: "events",
  slug: "arab-poetry-festival-eighth",
  common: {
    eventType: festival.id,
    editionNumber: 8,
    featuredOnHomepage: false,
    startDateTime: "2026-06-27T12:00:00.000Z",
    endDateTime: "2026-06-29T14:00:00.000Z",
    timezone: "Europe/Istanbul",
    country: turkey.id,
    city: istanbul.id,
    attendanceMode: "invitation",
    coverImage: posterImage.id,
    gallery: [posterImage.id, associationImage.id],
    participants: [
      { person: mustafa.id, eventRole: "poet", isFeatured: true, order: 1 },
      { person: ibtisam.id, eventRole: "poet", isFeatured: true, order: 2 },
      { person: khaled.id, eventRole: "presenter", isFeatured: false, order: 3 },
    ],
    programMode: "single",
    programDays: [],
  },
  ar: {
    title: "مهرجان الشعر العربي — الدورة الثامنة",
    shortDescription: "أرشيف الدورة الثامنة وصورها وبرنامجها الختامي.",
    fullDescription: richText("وثّقت الدورة الثامنة مشاركة شعراء من دول متعددة ضمن أمسيات وندوات وفقرات تكريم."),
    venueName: "إسطنبول",
  },
  en: {
    title: "Arab Poetry Festival — Eighth Edition",
    shortDescription: "Archive of the eighth edition, including its program and gallery.",
    fullDescription: richText("The eighth edition brought poets from multiple countries together for readings, seminars, and recognition ceremonies."),
    venueName: "Istanbul",
  },
  drafts: true,
});

await upsertLocalized({
  collection: "events",
  slug: "cairo-contemporary-poetry-evening",
  common: {
    eventType: evening.id,
    featuredOnHomepage: false,
    startDateTime: "2026-09-22T15:00:00.000Z",
    endDateTime: "2026-09-22T18:00:00.000Z",
    timezone: "Africa/Cairo",
    country: egypt.id,
    city: cairo.id,
    attendanceMode: "open",
    coverImage: eventSquareImage.id,
    gallery: [eventSquareImage.id],
    participants: [{ person: hassan.id, eventRole: "poet", isFeatured: true, order: 1 }],
    programMode: "single",
    programDays: [],
  },
  ar: {
    title: "أمسية الشعر العربي المعاصر",
    shortDescription: "مسودة فعالية لا يجب أن تظهر للعامة قبل النشر.",
    fullDescription: richText("فعالية تجريبية مخصصة لاختبار دورة المسودة والنشر داخل Payload CMS."),
    venueName: "القاهرة",
  },
  en: {
    title: "Contemporary Arabic Poetry Evening",
    shortDescription: "A draft event that must not appear publicly before publishing.",
    fullDescription: richText("A sample event used to test the draft and publishing workflow in Payload CMS."),
    venueName: "Cairo",
  },
  drafts: true,
  published: false,
});

console.log("Seeding partners and globals...");
const culturalPartner = await upsertLocalized({
  collection: "partners",
  slug: "arab-cultural-center",
  common: {
    logo: logo.id,
    website: "https://example.org/arab-cultural-center",
    relationshipType: "partner",
    associationWide: true,
    events: [upcomingEvent.id],
    isActive: true,
    order: 1,
  },
  ar: { name: "المركز الثقافي العربي", description: "شريك ثقافي تجريبي للمنصة." },
  en: { name: "Arab Cultural Center", description: "A sample cultural partner for the platform." },
});
const mediaPartner = await upsertLocalized({
  collection: "partners",
  slug: "poetry-media-network",
  common: {
    logo: logo.id,
    website: "https://example.org/poetry-media",
    relationshipType: "media",
    associationWide: true,
    events: [upcomingEvent.id],
    isActive: true,
    order: 2,
  },
  ar: { name: "شبكة إعلام الشعر", description: "شريك إعلامي تجريبي." },
  en: { name: "Poetry Media Network", description: "A sample media partner." },
});

const currentSiteSettings = await payload.findGlobal({
  slug: "site-settings",
  locale: "ar",
  overrideAccess: true,
  depth: 0,
});
if (updateExisting || !currentSiteSettings.associationName) {
  await payload.updateGlobal({
    slug: "site-settings",
    locale: "ar",
    overrideAccess: true,
    data: {
      associationName: "جمعية الشعر العربي",
      slogan: "لأن الشعر يجمعنا",
      logo: logo.id,
      defaultSocialImage: istanbulImage.id,
      officialEmail: "info@example.org",
      whatsapp: "+970000000000",
      socialLinks: [
        { platform: "facebook", url: "https://example.org/facebook" },
        { platform: "instagram", url: "https://example.org/instagram" },
      ],
    },
  });
  await payload.updateGlobal({
    slug: "site-settings",
    locale: "en",
    overrideAccess: true,
    data: {
      associationName: "Arab Poets Association",
      slogan: "Poetry brings us together",
    },
  });
}

const currentHomepage = await payload.findGlobal({
  slug: "homepage",
  locale: "ar",
  overrideAccess: true,
  draft: true,
  depth: 0,
});
if (updateExisting || !currentHomepage.featuredEvent) {
  await payload.updateGlobal({
    slug: "homepage",
    locale: "ar",
    overrideAccess: true,
    draft: false,
    data: {
      _status: "published",
      heroMode: "featuredEvent",
      featuredEvent: upcomingEvent.id,
      featuredPeople: [mustafa.id, ibtisam.id, hassan.id, khaled.id],
      selectedPartners: [culturalPartner.id, mediaPartner.id],
      showNews: false,
    },
  });
  await payload.updateGlobal({
    slug: "homepage",
    locale: "en",
    overrideAccess: true,
    draft: false,
    data: { _status: "published" },
  });
}

console.log("Seed completed successfully.");
console.log("Published events: 2; draft events: 1; public people: 4; hidden draft people: 1.");
console.log("Run the seed again to verify idempotency; existing versioned records are skipped by default.");
console.log("Use SEED_UPDATE_EXISTING=true only when fixture content must be refreshed.");
process.exit(0);
