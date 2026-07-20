import type { Field } from "payload";
import { bilingual } from "./i18n";
import { toSlug } from "./validators";

export const slugField = (sourceField = "title"): Field => ({
  name: "slug",
  label: bilingual("المعرّف في الرابط", "URL slug"),
  type: "text",
  required: true,
  unique: true,
  index: true,
  admin: {
    position: "sidebar",
    description: bilingual(
      "يُنشأ تلقائيًا عند تركه فارغًا، ويمكن تعديله قبل النشر.",
      "Generated automatically when empty and editable before publishing.",
    ),
  },
  hooks: {
    beforeValidate: [
      ({ value, siblingData }) => {
        if (typeof value === "string" && value.trim()) return toSlug(value);
        const sourceValue = siblingData?.[sourceField];
        return typeof sourceValue === "string" ? toSlug(sourceValue) : value;
      },
    ],
  },
  validate: (value: unknown) =>
    typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
      ? true
      : "استخدم حروفًا لاتينية صغيرة وأرقامًا وشرطات فقط / Use lowercase Latin letters, numbers, and hyphens only.",
});

export const seoFields = (): Field => ({
  name: "seo",
  label: bilingual("تهيئة محركات البحث", "SEO"),
  type: "group",
  fields: [
    {
      name: "metaTitle",
      label: bilingual("عنوان الصفحة", "Meta title"),
      type: "text",
      localized: true,
      maxLength: 70,
    },
    {
      name: "metaDescription",
      label: bilingual("وصف الصفحة", "Meta description"),
      type: "textarea",
      localized: true,
      maxLength: 170,
    },
    {
      name: "customOgImage",
      label: bilingual("صورة المشاركة", "Social sharing image"),
      type: "relationship",
      relationTo: "media",
    },
    {
      name: "noIndex",
      label: bilingual("منع الأرشفة", "Prevent indexing"),
      type: "checkbox",
      defaultValue: false,
    },
  ],
});
