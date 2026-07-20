import type { StaticLabel } from "payload";

export const bilingual = (ar: string, en: string): StaticLabel => ({ ar, en });

export const collectionLabels = (
  singularAr: string,
  pluralAr: string,
  singularEn: string,
  pluralEn: string,
) => ({
  singular: bilingual(singularAr, singularEn),
  plural: bilingual(pluralAr, pluralEn),
});

export const adminGroups = {
  content: bilingual("المحتوى", "Content"),
  events: bilingual("الفعاليات", "Events"),
  inboxes: bilingual("صندوق الوارد", "Inboxes"),
  people: bilingual("الأشخاص", "People"),
  system: bilingual("النظام", "System"),
  taxonomies: bilingual("التصنيفات", "Taxonomies"),
} as const;

export const option = (value: string, ar: string, en: string) => ({
  value,
  label: bilingual(ar, en),
});
