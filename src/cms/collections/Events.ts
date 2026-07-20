import type { CollectionConfig } from "payload";
import {
  adminDeleteOnly,
  adminOrEditor,
  fieldAdminOrEditor,
  publishedOrAuthenticated,
} from "../access";
import { seoFields, slugField } from "../fields";
import { adminGroups, bilingual, collectionLabels, option } from "../i18n";
import { validateCityCountry } from "../relations";
import { validateOptionalURL } from "../validators";

const validateEnd = (
  value: unknown,
  { siblingData }: { siblingData?: Record<string, unknown> },
) =>
  !value ||
  !siblingData?.startDateTime ||
  new Date(String(value)) >= new Date(String(siblingData.startDateTime)) ||
  "لا يمكن أن يسبق تاريخ النهاية تاريخ البداية / End date cannot precede start date.";

export const Events: CollectionConfig = {
  slug: "events",
  labels: collectionLabels("فعالية", "الفعاليات", "Event", "Events"),
  admin: {
    useAsTitle: "title",
    group: adminGroups.events,
    defaultColumns: ["title", "eventType", "startDateTime", "country", "_status"],
  },
  access: {
    create: adminOrEditor,
    read: publishedOrAuthenticated,
    update: adminOrEditor,
    delete: adminDeleteOnly,
  },
  versions: { drafts: { autosave: { interval: 15000 }, localizeStatus: true }, maxPerDoc: 30 },
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        await validateCityCountry({
          city: data.city,
          country: data.country,
          req,
          collection: "events",
        });
        return data;
      },
    ],
  },
  fields: [
    {
      name: "title",
      label: bilingual("عنوان الفعالية", "Event title"),
      type: "text",
      localized: true,
      required: true,
      minLength: 3,
      maxLength: 150,
      index: true,
    },
    slugField("title"),
    {
      name: "eventType",
      label: bilingual("نوع الفعالية", "Event type"),
      type: "relationship",
      relationTo: "event-types",
      required: true,
      index: true,
    },
    {
      name: "series",
      label: bilingual("سلسلة الفعالية", "Event series"),
      type: "relationship",
      relationTo: "event-series",
    },
    {
      name: "editionName",
      label: bilingual("اسم الدورة", "Edition name"),
      type: "text",
      localized: true,
    },
    {
      name: "editionNumber",
      label: bilingual("رقم الدورة", "Edition number"),
      type: "number",
      min: 1,
    },
    {
      name: "shortDescription",
      label: bilingual("الوصف المختصر", "Short description"),
      type: "textarea",
      localized: true,
      required: true,
      maxLength: 320,
    },
    {
      name: "fullDescription",
      label: bilingual("الوصف الكامل", "Full description"),
      type: "richText",
      localized: true,
    },
    {
      name: "featuredOnHomepage",
      label: bilingual("فعالية مميزة في الرئيسية", "Feature on homepage"),
      type: "checkbox",
      defaultValue: false,
      index: true,
      admin: { position: "sidebar" },
    },
    {
      type: "row",
      fields: [
        {
          name: "startDateTime",
          label: bilingual("تاريخ ووقت البداية", "Start date and time"),
          type: "date",
          required: true,
          index: true,
          admin: { date: { pickerAppearance: "dayAndTime" } },
        },
        {
          name: "endDateTime",
          label: bilingual("تاريخ ووقت النهاية", "End date and time"),
          type: "date",
          index: true,
          validate: validateEnd,
          admin: { date: { pickerAppearance: "dayAndTime" } },
        },
      ],
    },
    {
      name: "timezone",
      label: bilingual("المنطقة الزمنية", "Timezone"),
      type: "select",
      required: true,
      defaultValue: "Asia/Gaza",
      options: [
        option("Asia/Gaza", "فلسطين — غزة", "Palestine — Gaza"),
        option("Asia/Hebron", "فلسطين — الخليل", "Palestine — Hebron"),
        option("Europe/Istanbul", "تركيا — إسطنبول", "Türkiye — Istanbul"),
        option("Asia/Amman", "الأردن — عمّان", "Jordan — Amman"),
        option("Africa/Cairo", "مصر — القاهرة", "Egypt — Cairo"),
        option("Asia/Riyadh", "السعودية — الرياض", "Saudi Arabia — Riyadh"),
        option("Asia/Dubai", "الإمارات — دبي", "UAE — Dubai"),
        option("UTC", "التوقيت العالمي", "UTC"),
      ],
    },
    {
      name: "country",
      label: bilingual("الدولة", "Country"),
      type: "relationship",
      relationTo: "countries",
      required: true,
      index: true,
    },
    {
      name: "city",
      label: bilingual("المدينة", "City"),
      type: "relationship",
      relationTo: "cities",
      index: true,
      filterOptions: ({ siblingData }) => {
        const country = (siblingData as { country?: unknown })?.country;
        return country ? { country: { equals: country } } : true;
      },
    },
    {
      name: "venueName",
      label: bilingual("اسم المكان", "Venue name"),
      type: "text",
      localized: true,
    },
    {
      name: "addressText",
      label: bilingual("العنوان التفصيلي", "Address"),
      type: "textarea",
      localized: true,
    },
    {
      name: "attendanceMode",
      label: bilingual("نظام الحضور", "Attendance mode"),
      type: "select",
      required: true,
      defaultValue: "open",
      options: [
        option("open", "حضور مفتوح", "Open attendance"),
        option("invitation", "بدعوة", "Invitation only"),
        option("requestApproval", "يتطلب موافقة", "Approval required"),
      ],
    },
    {
      name: "attendanceNote",
      label: bilingual("ملاحظة الحضور", "Attendance note"),
      type: "textarea",
      localized: true,
    },
    {
      name: "coverImage",
      label: bilingual("صورة الغلاف", "Cover image"),
      type: "relationship",
      relationTo: "media",
    },
    {
      name: "socialImage",
      label: bilingual("صورة المشاركة الاجتماعية", "Social image"),
      type: "relationship",
      relationTo: "media",
    },
    {
      name: "posterImage",
      label: bilingual("ملصق الفعالية", "Event poster"),
      type: "relationship",
      relationTo: "media",
    },
    {
      name: "gallery",
      label: bilingual("معرض الصور", "Gallery"),
      type: "relationship",
      relationTo: "media",
      hasMany: true,
    },
    {
      name: "youtubeUrl",
      label: bilingual("رابط يوتيوب", "YouTube URL"),
      type: "text",
      validate: validateOptionalURL,
    },
    {
      name: "participants",
      label: bilingual("المشاركون", "Participants"),
      type: "array",
      fields: [
        {
          name: "person",
          label: bilingual("الشخص", "Person"),
          type: "relationship",
          relationTo: "people",
          required: true,
        },
        {
          name: "eventRole",
          label: bilingual("الدور في الفعالية", "Event role"),
          type: "select",
          required: true,
          options: [
            option("poet", "شاعر", "Poet"),
            option("presenter", "مقدم", "Presenter"),
            option("guest", "ضيف", "Guest"),
            option("judge", "محكّم", "Judge"),
            option("honoree", "مكرّم", "Honoree"),
            option("organizer", "منظم", "Organizer"),
            option("other", "أخرى", "Other"),
          ],
        },
        {
          name: "customRoleLabel",
          label: bilingual("مسمى مخصص", "Custom role label"),
          type: "text",
          localized: true,
        },
        {
          name: "isFeatured",
          label: bilingual("مشارك مميز", "Featured participant"),
          type: "checkbox",
          defaultValue: false,
        },
        {
          name: "order",
          label: bilingual("الترتيب", "Order"),
          type: "number",
          required: true,
          defaultValue: 0,
          min: 0,
        },
      ],
    },
    {
      name: "programMode",
      label: bilingual("نمط البرنامج", "Program mode"),
      type: "select",
      required: true,
      defaultValue: "single",
      options: [
        option("single", "برنامج واحد", "Single program"),
        option("perDay", "برنامج لكل يوم", "Program per day"),
        option("sharedAcrossDays", "برنامج مشترك للأيام", "Shared across days"),
      ],
    },
    {
      name: "programDays",
      label: bilingual("أيام البرنامج", "Program days"),
      type: "array",
      fields: [
        {
          name: "label",
          label: bilingual("اسم اليوم", "Day label"),
          type: "text",
          localized: true,
          required: true,
        },
        {
          name: "date",
          label: bilingual("التاريخ", "Date"),
          type: "date",
          admin: { date: { pickerAppearance: "dayOnly" } },
        },
        {
          name: "items",
          label: bilingual("فقرات البرنامج", "Program items"),
          type: "array",
          required: true,
          fields: [
            {
              name: "title",
              label: bilingual("العنوان", "Title"),
              type: "text",
              localized: true,
              required: true,
            },
            { name: "startTime", label: bilingual("وقت البداية", "Start time"), type: "text" },
            {
              name: "durationMinutes",
              label: bilingual("المدة بالدقائق", "Duration in minutes"),
              type: "number",
              min: 1,
              max: 1440,
            },
            { name: "presenter", label: bilingual("المقدم", "Presenter"), type: "relationship", relationTo: "people" },
            { name: "participants", label: bilingual("المشاركون", "Participants"), type: "relationship", relationTo: "people", hasMany: true },
            { name: "description", label: bilingual("الوصف", "Description"), type: "textarea", localized: true },
            { name: "venue", label: bilingual("المكان", "Venue"), type: "text", localized: true },
            { name: "image", label: bilingual("الصورة", "Image"), type: "relationship", relationTo: "media" },
          ],
        },
      ],
    },
    { name: "honorees", label: bilingual("المكرّمون", "Honorees"), type: "relationship", relationTo: "people", hasMany: true },
    { name: "closingReport", label: bilingual("التقرير الختامي", "Closing report"), type: "richText", localized: true },
    { name: "recommendations", label: bilingual("التوصيات", "Recommendations"), type: "richText", localized: true },
    { name: "relatedEvents", label: bilingual("فعاليات مرتبطة", "Related events"), type: "relationship", relationTo: "events", hasMany: true },
    {
      name: "archive",
      label: bilingual("بيانات الأرشفة والتحقق", "Archive and verification"),
      type: "group",
      access: { read: ({ req }) => Boolean(req.user), update: fieldAdminOrEditor },
      fields: [
        { name: "sourceFacebookUrl", label: bilingual("رابط المصدر", "Source URL"), type: "text", validate: validateOptionalURL },
        {
          name: "verificationStatus",
          label: bilingual("حالة التحقق", "Verification status"),
          type: "select",
          required: true,
          defaultValue: "unverified",
          options: [
            option("unverified", "غير متحقق", "Unverified"),
            option("needsReview", "يحتاج مراجعة", "Needs review"),
            option("verified", "متحقق", "Verified"),
            option("approvedWithGaps", "معتمد مع نواقص", "Approved with gaps"),
          ],
        },
        { name: "verificationNotes", label: bilingual("ملاحظات التحقق", "Verification notes"), type: "textarea" },
        { name: "verifiedBy", label: bilingual("تم التحقق بواسطة", "Verified by"), type: "relationship", relationTo: "users" },
        { name: "verifiedAt", label: bilingual("تاريخ التحقق", "Verified at"), type: "date" },
      ],
    },
    seoFields(),
  ],
};
