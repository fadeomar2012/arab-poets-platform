import type { Locale } from "./config";

const ar = {
  associationName: "الجمعية الدولية للشعراء العرب",
  slogan: "نعيش لفكرة حرة",
  nav: {
    home: "الرئيسية",
    about: "من نحن",
    events: "الفعاليات",
    people: "الشعراء والأدباء",
    gallery: "معرض الصور",
    contact: "تواصل معنا",
    participate: "طلب المشاركة",
  },
  common: {
    details: "عرض التفاصيل",
    viewAll: "عرض الكل",
    previous: "الفعاليات السابقة",
    upcoming: "الفعاليات القادمة",
    country: "الدولة",
    city: "المدينة",
    year: "السنة",
    role: "الدور",
    reset: "إعادة الضبط",
    search: "بحث",
    noResults: "لا توجد نتائج مطابقة",
    retry: "إعادة المحاولة",
  },
};

const en: typeof ar = {
  associationName: "International Association of Arab Poets",
  slogan: "We live for a free idea",
  nav: {
    home: "Home",
    about: "About",
    events: "Events",
    people: "Poets & Writers",
    gallery: "Gallery",
    contact: "Contact",
    participate: "Participate",
  },
  common: {
    details: "View details",
    viewAll: "View all",
    previous: "Previous events",
    upcoming: "Upcoming events",
    country: "Country",
    city: "City",
    year: "Year",
    role: "Role",
    reset: "Reset",
    search: "Search",
    noResults: "No matching results",
    retry: "Try again",
  },
};

export type Dictionary = typeof ar;

export function getDictionary(locale: Locale): Dictionary {
  return locale === "ar" ? ar : en;
}
