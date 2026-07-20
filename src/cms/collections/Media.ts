import type { CollectionConfig } from "payload";
import { adminDeleteOnly, adminOrEditor } from "../access";
import { adminGroups, bilingual, collectionLabels } from "../i18n";

export const Media: CollectionConfig = {
  slug: "media",
  labels: collectionLabels("ملف وسائط", "مكتبة الوسائط", "Media item", "Media library"),
  admin: { useAsTitle: "filename", group: adminGroups.content },
  access: {
    create: adminOrEditor,
    read: () => true,
    update: adminOrEditor,
    delete: adminDeleteOnly,
  },
  upload: {
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
    displayPreview: true,
    focalPoint: false,
    crop: false,
  },
  fields: [
    {
      name: "internalSeedKey",
      type: "text",
      unique: true,
      index: true,
      admin: { hidden: true },
      access: {
        read: ({ req }) => Boolean(req.user),
        create: ({ req }) => Boolean(req.user),
        update: ({ req }) => Boolean(req.user),
      },
    },
    {
      name: "alt",
      label: bilingual("النص البديل", "Alternative text"),
      type: "text",
      localized: true,
      required: true,
      admin: {
        description: bilingual(
          "صف الصورة باختصار لدعم الوصول ومحركات البحث.",
          "Briefly describe the image for accessibility and search engines.",
        ),
      },
    },
    {
      name: "caption",
      label: bilingual("التعليق", "Caption"),
      type: "textarea",
      localized: true,
    },
    { name: "credit", label: bilingual("حقوق الصورة", "Credit"), type: "text" },
    {
      name: "sourceEvent",
      label: bilingual("الفعالية المصدر", "Source event"),
      type: "relationship",
      relationTo: "events",
    },
  ],
};
