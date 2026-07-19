import type { Locale } from "@/i18n/config";
import type { AttendanceMode } from "@/lib/content/types";

export function formatDateRange(start: string, end: string | undefined, locale: Locale): string {
  const formatter = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const startDate = new Date(start);
  if (!end) return formatter.format(startDate);
  const endDate = new Date(end);
  if (startDate.toDateString() === endDate.toDateString()) return formatter.format(startDate);
  return `${formatter.format(startDate)} – ${formatter.format(endDate)}`;
}

export function attendanceLabel(mode: AttendanceMode, locale: Locale): string {
  const labels = {
    ar: { open: "مفتوح للجميع", invitation: "بدعوة", requestApproval: "طلب حضور وموافقة" },
    en: { open: "Open to all", invitation: "Invitation only", requestApproval: "Request and approval" },
  } as const;
  return labels[locale][mode];
}
