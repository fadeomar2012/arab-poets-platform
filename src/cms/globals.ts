import type { GlobalConfig } from "payload";
import { adminOnly, adminOrEditor } from "./access";
import { adminGroups, bilingual, option } from "./i18n";
import { validateOptionalURL } from "./validators";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: bilingual("إعدادات الموقع", "Site settings"),
  admin: { group: adminGroups.content },
  access: { read: () => true, update: adminOnly },
  fields: [
    {
      name: "associationName",
      label: bilingual("اسم الجمعية", "Association name"),
      type: "text",
      localized: true,
      required: true,
    },
    {
      name: "slogan",
      label: bilingual("الشعار النصي", "Slogan"),
      type: "text",
      localized: true,
    },
    { name: "logo", label: bilingual("الشعار", "Logo"), type: "relationship", relationTo: "media" },
    {
      name: "defaultSocialImage",
      label: bilingual("صورة المشاركة الافتراضية", "Default social image"),
      type: "relationship",
      relationTo: "media",
    },
    {
      name: "officialEmail",
      label: bilingual("البريد الرسمي", "Official email"),
      type: "email",
      required: true,
    },
    {
      name: "whatsapp",
      label: bilingual("رقم واتساب", "WhatsApp number"),
      type: "text",
      required: true,
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
  ],
};

export const Homepage: GlobalConfig = {
  slug: "homepage",
  label: bilingual("الصفحة الرئيسية", "Homepage"),
  admin: { group: adminGroups.content },
  access: { read: () => true, update: adminOrEditor },
  versions: { drafts: { localizeStatus: true }, max: 30 },
  fields: [
    {
      name: "heroMode",
      label: bilingual("نمط الواجهة الرئيسية", "Hero mode"),
      type: "select",
      required: true,
      defaultValue: "automatic",
      options: [
        option("automatic", "تلقائي", "Automatic"),
        option("featuredEvent", "فعالية محددة", "Selected event"),
        option("institutional", "واجهة مؤسسية", "Institutional hero"),
      ],
    },
    {
      name: "featuredEvent",
      label: bilingual("الفعالية المميزة", "Featured event"),
      type: "relationship",
      relationTo: "events",
      admin: { condition: (_, siblingData) => siblingData?.heroMode === "featuredEvent" },
    },
    {
      name: "institutionalHero",
      label: bilingual("محتوى الواجهة المؤسسية", "Institutional hero content"),
      type: "group",
      admin: { condition: (_, siblingData) => siblingData?.heroMode === "institutional" },
      fields: [
        { name: "title", label: bilingual("العنوان", "Title"), type: "text", localized: true },
        {
          name: "description",
          label: bilingual("الوصف", "Description"),
          type: "textarea",
          localized: true,
        },
        { name: "image", label: bilingual("الصورة", "Image"), type: "relationship", relationTo: "media" },
      ],
    },
    {
      name: "featuredPeople",
      label: bilingual("أشخاص مميزون", "Featured people"),
      type: "relationship",
      relationTo: "people",
      hasMany: true,
    },
    {
      name: "selectedPartners",
      label: bilingual("شركاء مختارون", "Selected partners"),
      type: "relationship",
      relationTo: "partners",
      hasMany: true,
    },
    {
      name: "showNews",
      label: bilingual("إظهار قسم الأخبار", "Show news section"),
      type: "checkbox",
      defaultValue: false,
    },
  ],
};
