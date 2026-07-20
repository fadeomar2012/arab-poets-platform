import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventFilters } from "@/components/events/EventFilters";
import { isLocale } from "@/i18n/config";
import { getEvents } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: locale === "ar" ? "الفعاليات" : "Events" };
}

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const events = await getEvents(raw);

  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <h1>{raw === "ar" ? "الفعاليات" : "Events"}</h1>
          <p>
            {raw === "ar"
              ? "استكشف الفعاليات القادمة والجارية والأرشيف الثقافي للجمعية."
              : "Explore upcoming and ongoing events and the association’s cultural archive."}
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <EventFilters events={events} locale={raw} />
        </div>
      </section>
    </main>
  );
}
