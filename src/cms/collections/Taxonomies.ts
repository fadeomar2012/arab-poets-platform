import type { CollectionConfig, Field } from "payload";
import { activeOrAuthenticated, adminDeleteOnly, adminOrEditor } from "../access";
import { slugField } from "../fields";
import { adminGroups, bilingual, collectionLabels } from "../i18n";
import { collectionRevalidationHooks } from "../hooks/revalidate";

const baseFields = (): Field[] => [
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
];

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
  admin: {
    useAsTitle: "name",
    group,
    defaultColumns: ["name", "isActive", "order", "updatedAt"],
  },
  access: {
    create: adminOrEditor,
    read: activeOrAuthenticated,
    update: adminOrEditor,
    delete: adminDeleteOnly,
  },
  fields: baseFields(),
});

export const EventTypes: CollectionConfig = {
  ...base(
    "event-types",
    "نوع فعالية",
    "أنواع الفعاليات",
    "Event type",
    "Event types",
    adminGroups.events,
  ),
  hooks: collectionRevalidationHooks({ areas: ["home", "events"], detailArea: "events" }),
  admin: {
    useAsTitle: "name",
    group: adminGroups.events,
    defaultColumns: ["name", "calendarColor", "isActive", "order"],
    description:
      "تُستخدم أنواع الفعاليات في الفلاتر ومفتاح ألوان الروزنامة / Event types power calendar filters and colors.",
  },
  fields: [
    ...baseFields(),
    {
      name: "calendarColor",
      label: bilingual("لون الروزنامة", "Calendar color"),
      type: "text",
      defaultValue: "#B88A2C",
      validate: (value: unknown) =>
        !value || /^#[0-9a-fA-F]{6}$/.test(String(value))
          ? true
          : "استخدم لون HEX مثل #B88A2C / Use a HEX color such as #B88A2C.",
      admin: {
        description:
          "لون النقطة والوسم داخل الروزنامة. مثال: #B88A2C / Dot and badge color in the calendar.",
      },
    },
    {
      name: "showInCalendarLegend",
      label: bilingual("إظهار في مفتاح الروزنامة", "Show in calendar legend"),
      type: "checkbox",
      defaultValue: true,
    },
  ],
};

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
