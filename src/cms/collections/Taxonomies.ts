import type { CollectionConfig, Field } from "payload";
import { activeOrAuthenticated, adminDeleteOnly, adminOrEditor } from "../access";
import { slugField } from "../fields";
import { adminGroups, bilingual, collectionLabels, hints } from "../i18n";
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
    admin: { description: hints.isActive },
  },
  {
    name: "order",
    label: bilingual("الترتيب", "Order"),
    type: "number",
    defaultValue: 0,
    min: 0,
    admin: { description: hints.order },
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

const countriesBase = base("countries", "دولة", "الدول", "Country", "Countries");
export const Countries: CollectionConfig = {
  ...countriesBase,
  admin: {
    ...countriesBase.admin,
    description: bilingual(
      "تصفّح القائمة أولًا للتأكد من عدم وجود الدولة قبل إضافة واحدة جديدة، لتجنّب التكرار.",
      "Browse the list first to confirm the country doesn't already exist before adding a new one — this avoids duplicates.",
    ),
  },
};

const citiesBase = base("cities", "مدينة", "المدن", "City", "Cities");
export const Cities: CollectionConfig = {
  ...citiesBase,
  admin: {
    ...citiesBase.admin,
    description: bilingual(
      "تصفّح القائمة أولًا للتأكد من عدم وجود المدينة قبل إضافة واحدة جديدة، لتجنّب التكرار.",
      "Browse the list first to confirm the city doesn't already exist before adding a new one — this avoids duplicates.",
    ),
  },
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
      admin: { description: hints.pickOrCreate },
    },
    {
      name: "isActive",
      label: bilingual("نشطة", "Active"),
      type: "checkbox",
      required: true,
      defaultValue: true,
      admin: { description: hints.isActive },
    },
    {
      name: "order",
      label: bilingual("الترتيب", "Order"),
      type: "number",
      defaultValue: 0,
      min: 0,
      admin: { description: hints.order },
    },
  ],
};
