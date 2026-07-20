import type { Metadata } from "next";
import Image from "@/components/ui/SmartImage";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Gallery } from "@/components/gallery/Gallery";
import { PersonCard } from "@/components/people/PersonCard";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Icon } from "@/components/ui/Icon";
import { isLocale } from "@/i18n/config";
import { getEventBySlug, getPeopleBySlugs } from "@/lib/content";
import type { EventStatus, GalleryItem } from "@/lib/content/types";
import { localize } from "@/lib/content/types";
import { attendanceLabel, formatDateRange } from "@/lib/format";

export const revalidate = 300;
export const dynamicParams = true;

const statusLabel = (status: EventStatus, locale: "ar" | "en") => ({ upcoming: { ar: "فعالية قادمة", en: "Upcoming" }, ongoing: { ar: "جارية الآن", en: "Ongoing" }, past: { ar: "فعالية سابقة", en: "Past event" } } as const)[status][locale];

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> { const { locale, slug } = await params; if (!isLocale(locale)) return {}; const event = await getEventBySlug(slug, locale); return event ? { title: localize(event.title, locale), description: localize(event.shortDescription, locale) } : {}; }

export default async function EventPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: raw, slug } = await params; if (!isLocale(raw)) notFound(); const event = await getEventBySlug(slug, raw); if (!event) notFound();
  const participants = await getPeopleBySlugs(event.participantSlugs, raw);
  const gallery: GalleryItem[] = event.gallery.map((image) => ({ ...image, eventSlug: event.slug, eventTitle: event.title, eventDate: event.startDate, eventLocation: event.city }));
  return <main>
    <section className="event-hero"><div className="event-hero-pattern" aria-hidden="true" /><div className="container event-hero-grid">
      <div className="event-hero-copy reveal"><ArrowLink className="event-back-link" href={`/${raw}/events`}>{raw === "ar" ? "العودة إلى الروزنامة" : "Back to calendar"}</ArrowLink><div className="pill-row"><span className="pill">{localize(event.type, raw)}</span><span className={`pill status-pill status-pill--${event.status}`}>{statusLabel(event.status, raw)}</span></div><h1>{localize(event.title, raw)}</h1><p>{localize(event.shortDescription, raw)}</p><div className="event-hero-facts"><span><Icon name="calendar" /><b>{formatDateRange(event.startDate, event.endDate, raw)}</b></span><span><Icon name="location" /><b>{localize(event.city, raw)}, {localize(event.country, raw)}</b></span><span><Icon name="people" /><b>{attendanceLabel(event.attendance, raw)}</b></span></div><div className="hero-actions">{event.status !== "past" ? <Link className="button button-primary" href={`/${raw}/participate?event=${event.slug}`}>{raw === "ar" ? "طلب المشاركة" : "Request participation"}<Icon name="arrow" /></Link> : null}<a className="button button-outline" href={`mailto:?subject=${encodeURIComponent(localize(event.title, raw))}`}>{raw === "ar" ? "مشاركة الفعالية" : "Share event"}</a></div></div>
      <div className="event-cover reveal"><Image src={event.image.url} alt={localize(event.image.alt, raw)} fill priority sizes="(max-width:760px) 100vw, 44vw" /></div>
    </div></section>

    <section className="section"><div className="container detail-layout"><article className="event-article"><section className="event-intro"><span className="section-eyebrow">{raw === "ar" ? "نبذة عن الفعالية" : "About the event"}</span><h2>{raw === "ar" ? "مساحة للقصيدة والحوار" : "A space for poetry and dialogue"}</h2><p className="prose">{localize(event.fullDescription, raw) || localize(event.shortDescription, raw)}</p></section>
      {event.program.length ? <section className="content-section"><div className="content-section-heading"><span className="section-eyebrow">{raw === "ar" ? "تفاصيل اليوم" : "Schedule"}</span><h2>{raw === "ar" ? "البرنامج" : "Program"}</h2></div><div className="timeline">{event.program.map((item, index) => <article className="timeline-item" key={`${localize(item.title, raw)}-${index}`}><div className="timeline-marker"><span>{index + 1}</span></div><div className="timeline-card card"><div className="timeline-time"><Icon name="clock" /><strong>{item.time || (raw === "ar" ? "الوقت يحدد لاحقًا" : "Time TBC")}{item.duration ? ` · ${item.duration} ${raw === "ar" ? "دقيقة" : "min"}` : ""}</strong></div><h3>{localize(item.title, raw)}</h3>{item.description ? <p>{localize(item.description, raw)}</p> : null}</div></article>)}</div></section> : null}
      {participants.length ? <section className="content-section"><div className="content-section-heading"><span className="section-eyebrow">{raw === "ar" ? "ضيوف البرنامج" : "Program guests"}</span><h2>{raw === "ar" ? "المشاركون" : "Participants"}</h2></div><div className="people-grid people-grid--event">{participants.map((person) => <PersonCard person={person} locale={raw} compact key={person.slug} />)}</div></section> : null}
      {gallery.length ? <section className="content-section"><div className="content-section-heading"><span className="section-eyebrow">{raw === "ar" ? "توثيق بصري" : "Visual archive"}</span><h2>{raw === "ar" ? "معرض الفعالية" : "Event gallery"}</h2></div><Gallery images={gallery} locale={raw} /></section> : null}
    </article>
    <aside className="event-sidebar"><div className="sidebar-card card sticky-card"><h3>{raw === "ar" ? "معلومات الفعالية" : "Event information"}</h3><dl><div><dt><Icon name="calendar" />{raw === "ar" ? "التاريخ" : "Date"}</dt><dd>{formatDateRange(event.startDate, event.endDate, raw)}</dd></div><div><dt><Icon name="location" />{raw === "ar" ? "المكان" : "Location"}</dt><dd>{event.venue ? `${localize(event.venue, raw)}، ` : ""}{localize(event.city, raw)}, {localize(event.country, raw)}</dd></div><div><dt><Icon name="people" />{raw === "ar" ? "الحضور" : "Attendance"}</dt><dd>{attendanceLabel(event.attendance, raw)}</dd></div><div><dt><Icon name="globe" />{raw === "ar" ? "المنطقة الزمنية" : "Timezone"}</dt><dd dir="ltr">{event.timezone}</dd></div></dl>{event.status !== "past" ? <Link className="button button-primary button-full" href={`/${raw}/participate?event=${event.slug}`}>{raw === "ar" ? "إرسال طلب مشاركة" : "Send participation request"}</Link> : <Link className="button button-dark button-full" href={`/${raw}/events`}>{raw === "ar" ? "عرض فعاليات أخرى" : "Browse other events"}</Link>}</div></aside>
    </div></section>
  </main>;
}
