import type { CollectionConfig } from "payload";
import { adminDeleteOnly, adminOrEditor, publicPeopleOrAuthenticated } from "../access";
import { seoFields, slugField } from "../fields";
import { adminGroups, bilingual, collectionLabels, option } from "../i18n";
import { validateCityCountry } from "../relations";
import { validateOptionalURL } from "../validators";
import { collectionRevalidationHooks } from "../hooks/revalidate";
import { collectionPreview } from "../preview";

export const People: CollectionConfig = {
  slug: "people",
  labels: collectionLabels("شخص", "الأشخاص", "Person", "People"),
  admin: {
    useAsTitle: "name",
    group: adminGroups.people,
    defaultColumns: ["name", "country", "showInPublicDirectory", "_status"],
    preview: collectionPreview("people"),
  },
  access: {
    create: adminOrEditor,
    read: publicPeopleOrAuthenticated,
    update: adminOrEditor,
    delete: adminDeleteOnly,
  },
  versions: { drafts: { autosave: { interval: 15000 }, localizeStatus: true }, maxPerDoc: 30 },
  hooks: {
    ...collectionRevalidationHooks({
      areas: ["home", "about", "people", "events"],
      detailArea: "people",
    }),
    beforeChange: [
      async ({ data, req }) => {
        await validateCityCountry({
          city: data.city,
          country: data.country,
          req,
          collection: "people",
        });
        return data;
      },
    ],
  },
  fields: [
    {
      name: "name",
      label: bilingual("الاسم", "Name"),
      type: "text",
      localized: true,
      required: true,
      minLength: 2,
      maxLength: 120,
      index: true,
    },
    slugField("name"),
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
      filterOptions: ({ siblingData }) => {
        const country = (siblingData as { country?: unknown })?.country;
        return country ? { country: { equals: country } } : true;
      },
    },
    {
      name: "penName",
      label: bilingual("الاسم الأدبي", "Pen name"),
      type: "text",
      localized: true,
    },
    {
      name: "profileImage",
      label: bilingual("الصورة الشخصية", "Profile image"),
      type: "relationship",
      relationTo: "media",
    },
    {
      name: "roles",
      label: bilingual("الصفات", "Roles"),
      type: "select",
      hasMany: true,
      options: [
        option("poet", "شاعر", "Poet"),
        option("writer", "كاتب", "Writer"),
        option("critic", "ناقد", "Critic"),
        option("artist", "فنان", "Artist"),
        option("media", "إعلامي", "Media professional"),
        option("presenter", "مقدم", "Presenter"),
        option("guest", "ضيف", "Guest"),
        option("boardMember", "عضو إدارة", "Board member"),
        option("teamMember", "عضو فريق", "Team member"),
        option("judge", "عضو لجنة تحكيم", "Judge"),
        option("honoree", "مكرّم", "Honoree"),
      ],
    },
    {
      name: "shortBio",
      label: bilingual("نبذة قصيرة", "Short bio"),
      type: "textarea",
      localized: true,
      maxLength: 600,
    },
    {
      name: "fullBio",
      label: bilingual("السيرة الكاملة", "Full biography"),
      type: "richText",
      localized: true,
    },
    {
      name: "profession",
      label: bilingual("المهنة", "Profession"),
      type: "text",
      localized: true,
    },
    {
      name: "website",
      label: bilingual("الموقع الشخصي", "Personal website"),
      type: "text",
      validate: validateOptionalURL,
    },
    {
      name: "socialLinks",
      label: bilingual("روابط التواصل", "Social links"),
      type: "array",
      fields: [
        {
          name: "platform",
          label: bilingual("المنصة", "Platform"),
          type: "select",
          required: true,
          options: ["facebook", "instagram", "youtube", "x", "other"],
        },
        {
          name: "url",
          label: bilingual("الرابط", "URL"),
          type: "text",
          required: true,
          validate: validateOptionalURL,
        },
      ],
    },
    {
      name: "email",
      label: bilingual("البريد الإلكتروني", "Email"),
      type: "email",
      access: { read: ({ req, data }) => Boolean(req.user) || Boolean(data?.showContactPublicly) },
    },
    {
      name: "phone",
      label: bilingual("الهاتف", "Phone"),
      type: "text",
      access: { read: ({ req, data }) => Boolean(req.user) || Boolean(data?.showContactPublicly) },
    },
    {
      name: "showContactPublicly",
      label: bilingual("إظهار بيانات التواصل للعامة", "Show contact details publicly"),
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "showInPublicDirectory",
      label: bilingual("إظهار في دليل الأشخاص", "Show in public directory"),
      type: "checkbox",
      required: true,
      defaultValue: false,
      index: true,
      admin: { position: "sidebar" },
    },
    {
      name: "displayOrder",
      label: bilingual("ترتيب العرض", "Display order"),
      type: "number",
      defaultValue: 0,
      min: 0,
    },
    seoFields(),
  ],
};
