import type { CollectionConfig } from "payload";
import { activeOrAuthenticated, adminDeleteOnly, adminOrEditor } from "../access";
import { slugField } from "../fields";
import { adminGroups, bilingual, collectionLabels, option } from "../i18n";
import { validateOptionalURL } from "../validators";

export const Partners: CollectionConfig = {
  slug: "partners",
  labels: collectionLabels("شريك", "الشركاء", "Partner", "Partners"),
  admin: { useAsTitle: "name", group: adminGroups.content },
  access: {
    create: adminOrEditor,
    read: activeOrAuthenticated,
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
    { name: "logo", label: bilingual("الشعار", "Logo"), type: "relationship", relationTo: "media" },
    {
      name: "website",
      label: bilingual("الموقع الإلكتروني", "Website"),
      type: "text",
      validate: validateOptionalURL,
    },
    {
      name: "description",
      label: bilingual("الوصف", "Description"),
      type: "textarea",
      localized: true,
    },
    {
      name: "relationshipType",
      label: bilingual("نوع العلاقة", "Relationship type"),
      type: "select",
      required: true,
      options: [
        option("partner", "شريك", "Partner"),
        option("sponsor", "راعٍ", "Sponsor"),
        option("organizer", "منظم", "Organizer"),
        option("supporter", "داعم", "Supporter"),
        option("media", "شريك إعلامي", "Media partner"),
      ],
    },
    {
      name: "associationWide",
      label: bilingual("شريك عام للجمعية", "Association-wide partner"),
      type: "checkbox",
      required: true,
      defaultValue: true,
    },
    {
      name: "events",
      label: bilingual("فعاليات مرتبطة", "Related events"),
      type: "relationship",
      relationTo: "events",
      hasMany: true,
    },
    {
      name: "isActive",
      label: bilingual("نشط", "Active"),
      type: "checkbox",
      required: true,
      defaultValue: true,
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
