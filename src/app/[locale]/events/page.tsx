import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventCalendar } from "@/components/events/EventCalendar";
import { PageHero } from "@/components/ui/PageHero";
import { isLocale } from "@/i18n/config";
import { getEvents } from "@/lib/content";

export const revalidate = 300;
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> { const { locale } = await params; return { title: locale === "ar" ? "الفعاليات" : "Events" }; }
export default async function EventsPage({ params }: { params: Promise<{ locale: string }> }) { const { locale: raw } = await params; if (!isLocale(raw)) notFound(); const events = await getEvents(raw); return <main><PageHero eyebrow={raw === "ar" ? "الروزنامة الثقافية" : "Cultural calendar"} title={raw === "ar" ? "الفعاليات" : "Events"} description={raw === "ar" ? "استكشف الفعاليات حسب الشهر واليوم والمكان والنوع، ثم انتقل مباشرة إلى تفاصيلها." : "Explore events by month, day, location, and type, then open the full details."} /><section className="section"><div className="container"><EventCalendar events={events} locale={raw} /></div></section></main>; }
