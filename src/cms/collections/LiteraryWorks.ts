import type { CollectionConfig } from "payload";
import { adminDeleteOnly, adminOrEditor, publishedOrAuthenticated } from "../access";
import { slugField } from "../fields";
import { adminGroups, bilingual, collectionLabels, option } from "../i18n";
import { validateOptionalURL } from "../validators";
import { collectionRevalidationHooks } from "../hooks/revalidate";

export const LiteraryWorks: CollectionConfig = {
  slug: "literary-works",
  labels: collectionLabels("عمل أدبي", "الأعمال الأدبية", "Literary work", "Literary works"),
  admin: { useAsTitle: "title", group: adminGroups.people },
  hooks: collectionRevalidationHooks({ areas: ["people"], detailArea: "people" }),
  versions: { drafts: { localizeStatus: true }, maxPerDoc: 30 },
  access: {
    create: adminOrEditor,
    read: publishedOrAuthenticated,
    update: adminOrEditor,
    delete: adminDeleteOnly,
  },
  fields: [
    {
      name: "title",
      label: bilingual("العنوان", "Title"),
      type: "text",
      localized: true,
      required: true,
      maxLength: 180,
    },
    slugField("title"),
    {
      name: "person",
      label: bilingual("صاحب العمل", "Author"),
      type: "relationship",
      relationTo: "people",
      required: true,
      index: true,
    },
    {
      name: "type",
      label: bilingual("النوع", "Type"),
      type: "select",
      required: true,
      options: [
        option("poetryCollection", "ديوان شعر", "Poetry collection"),
        option("book", "كتاب", "Book"),
        option("poem", "قصيدة", "Poem"),
        option("article", "مقال", "Article"),
        option("audio", "تسجيل صوتي", "Audio"),
        option("recitationVideo", "فيديو إلقاء", "Recitation video"),
        option("interview", "مقابلة", "Interview"),
        option("other", "أخرى", "Other"),
      ],
    },
    {
      name: "coverImage",
      label: bilingual("صورة الغلاف", "Cover image"),
      type: "relationship",
      relationTo: "media",
    },
    {
      name: "publicationYear",
      label: bilingual("سنة النشر", "Publication year"),
      type: "number",
      min: 1800,
      max: new Date().getFullYear() + 1,
    },
    {
      name: "publisher",
      label: bilingual("الناشر", "Publisher"),
      type: "text",
      localized: true,
    },
    {
      name: "description",
      label: bilingual("الوصف", "Description"),
      type: "textarea",
      localized: true,
    },
    {
      name: "externalUrl",
      label: bilingual("الرابط الخارجي", "External URL"),
      type: "text",
      validate: validateOptionalURL,
    },
    {
      name: "order",
      label: bilingual("الترتيب", "Order"),
      type: "number",
      defaultValue: 0,
      min: 0,
    },
  ],
};
