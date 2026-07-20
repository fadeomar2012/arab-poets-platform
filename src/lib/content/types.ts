import type { Locale } from "@/i18n/config";

export type LocalizedText = Record<Locale, string>;

export type MediaAsset = {
  url: string;
  alt: LocalizedText;
  caption?: LocalizedText;
  credit?: string;
};

export type EventStatus = "upcoming" | "ongoing" | "past";
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
  image?: MediaAsset;
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
  image: MediaAsset;
  featured?: boolean;
  participantSlugs: string[];
  program: ProgramItem[];
  youtubeUrl?: string;
  gallery: MediaAsset[];
};

export type SiteSettings = {
  associationName: LocalizedText;
  slogan?: LocalizedText;
  officialEmail?: string;
  whatsapp?: string;
};

export type HomepageSettings = {
  heroMode: "automatic" | "featuredEvent" | "institutional";
  featuredEventSlug?: string;
  institutionalTitle?: LocalizedText;
  institutionalDescription?: LocalizedText;
};

export function localize<T extends LocalizedText>(value: T, locale: Locale): string {
  return value[locale] || value.ar;
}
