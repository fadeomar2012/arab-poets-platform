import type { CollectionConfig } from "payload";
import { adminDeleteOnly, adminOrEditor, publishedOrAuthenticated } from "../access";
import { slugField } from "../fields";
import { adminGroups, bilingual, collectionLabels } from "../i18n";
import { collectionRevalidationHooks } from "../hooks/revalidate";

export const EventSeries: CollectionConfig = {
  slug: "event-series",
  labels: collectionLabels("سلسلة فعاليات", "سلاسل الفعاليات", "Event series", "Event series"),
  admin: { useAsTitle: "name", group: adminGroups.events },
  hooks: collectionRevalidationHooks({ areas: ["home", "events"], detailArea: "events" }),
  versions: { drafts: { localizeStatus: true }, maxPerDoc: 30 },
  access: {
    create: adminOrEditor,
    read: publishedOrAuthenticated,
    update: adminOrEditor,
    delete: adminDeleteOnly,
  },
  fields: [
    {
      name: "name",
      label: bilingual("الاسم", "Name"),
      type: "text",
      localized: true,
      required: true,
    },
    slugField("name"),
    {
      name: "description",
      label: bilingual("الوصف", "Description"),
      type: "textarea",
      localized: true,
    },
    { name: "logo", label: bilingual("الشعار", "Logo"), type: "relationship", relationTo: "media" },
    {
      name: "coverImage",
      label: bilingual("صورة الغلاف", "Cover image"),
      type: "relationship",
      relationTo: "media",
    },
  ],
};
