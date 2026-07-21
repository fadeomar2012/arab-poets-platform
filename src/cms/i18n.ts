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

/**
 * Reusable bilingual helper texts shown under inputs (admin.description).
 * Keeping them here keeps the wording consistent across every collection.
 */
export const hints = {
  order: bilingual(
    "يحدّد ترتيب الظهور في القوائم: الرقم الأصغر يظهر أولًا. اتركه 0 إذا لم يكن الترتيب مهمًا.",
    "Sets the display order in lists — smaller numbers appear first. Leave it 0 if order doesn't matter.",
  ),
  isActive: bilingual(
    "عند تفعيله يظهر هذا العنصر للزوّار وفي قوائم الاختيار. أزِل العلامة لإخفائه دون حذفه.",
    "When enabled, this item is visible to visitors and in pickers. Uncheck to hide it without deleting it.",
  ),
  pickOrCreate: bilingual(
    "انقر لاختيار عنصر موجود من القائمة قبل إضافة عنصر جديد. استخدم زر + فقط إذا لم يكن العنصر موجودًا مسبقًا.",
    "Click to pick an existing item from the list before adding a new one. Use the + button only if it doesn't already exist.",
  ),
} as const;
