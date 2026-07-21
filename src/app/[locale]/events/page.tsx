import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventCalendar } from "@/components/events/EventCalendar";
import { PageHero } from "@/components/ui/PageHero";
import { isLocale } from "@/i18n/config";
import { getEventFacets, getEventsInRange } from "@/lib/content";

export const revalidate = 300;
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> { const { locale } = await params; return { title: locale === "ar" ? "الفعاليات" : "Events" }; }

export default async function EventsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  // Seed only the events near "now" (previous month … +3 months) plus the
  // filter facets. The calendar fetches other months on demand from the scoped
  // public endpoint, so the browser never receives the full events archive.
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString().slice(0, 10);
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 3, 0)).toISOString().slice(0, 10);
  const [events, facets] = await Promise.all([getEventsInRange(from, to, raw), getEventFacets(raw)]);
  return (
    <main>
      <PageHero
        eyebrow={raw === "ar" ? "الروزنامة الثقافية" : "Cultural calendar"}
        title={raw === "ar" ? "الفعاليات" : "Events"}
        description={raw === "ar" ? "استكشف الفعاليات حسب الشهر واليوم والمكان والنوع، ثم انتقل مباشرة إلى تفاصيلها." : "Explore events by month, day, location, and type, then open the full details."}
      />
      <section className="section"><div className="container"><EventCalendar events={events} locale={raw} facets={facets} /></div></section>
    </main>
  );
}
