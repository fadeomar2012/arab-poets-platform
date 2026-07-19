import type { Locale } from "@/i18n/config";

export type LocalizedText = Record<Locale, string>;

export type EventStatus = "upcoming" | "past";
export type AttendanceMode = "open" | "invitation" | "requestApproval";

export type ProgramItem = {
  time?: string;
  duration?: string;
  title: LocalizedText;
  description?: LocalizedText;
};

export type PersonSummary = {
  slug: string;
  name: LocalizedText;
  country: LocalizedText;
  role: LocalizedText;
  initials: LocalizedText;
  visible: boolean;
};

export type LiteraryWork = {
  title: LocalizedText;
  type: LocalizedText;
  year?: number;
  externalUrl?: string;
};

export type Person = PersonSummary & {
  shortBio: LocalizedText;
  fullBio: LocalizedText;
  city?: LocalizedText;
  website?: string;
  works: LiteraryWork[];
  eventSlugs: string[];
};

export type Event = {
  slug: string;
  status: EventStatus;
  title: LocalizedText;
  type: LocalizedText;
  shortDescription: LocalizedText;
  fullDescription: LocalizedText;
  startDate: string;
  endDate?: string;
  timezone: string;
  country: LocalizedText;
  city: LocalizedText;
  venue?: LocalizedText;
  attendance: AttendanceMode;
  image: string;
  featured?: boolean;
  participantSlugs: string[];
  program: ProgramItem[];
  youtubeUrl?: string;
  gallery: string[];
};

export function localize<T extends LocalizedText>(value: T, locale: Locale): string {
  return value[locale] || value.ar;
}
