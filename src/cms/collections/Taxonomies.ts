import type { CollectionConfig } from "payload";
import { activeOrAuthenticated, adminDeleteOnly, adminOrEditor } from "../access";
import { slugField } from "../fields";
import { adminGroups, bilingual, collectionLabels } from "../i18n";

const base = (
  slug: string,
  singularAr: string,
  pluralAr: string,
  singularEn: string,
  pluralEn: string,
  group = adminGroups.taxonomies,
): CollectionConfig => ({
  slug,
  labels: collectionLabels(singularAr, pluralAr, singularEn, pluralEn),
  admin: { useAsTitle: "name", group },
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
      index: true,
    },
    slugField("name"),
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
});

export const EventTypes = base(
  "event-types",
  "نوع فعالية",
  "أنواع الفعاليات",
  "Event type",
  "Event types",
  adminGroups.events,
);
export const Countries = base("countries", "دولة", "الدول", "Country", "Countries");

export const Cities: CollectionConfig = {
  ...base("cities", "مدينة", "المدن", "City", "Cities"),
  fields: [
    {
      name: "name",
      label: bilingual("اسم المدينة", "City name"),
      type: "text",
      localized: true,
      required: true,
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
      name: "isActive",
      label: bilingual("نشطة", "Active"),
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
