import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Event } from "@/lib/content/types";
import { localize } from "@/lib/content/types";
import { formatDateRange } from "@/lib/format";

export function EventCard({ event, locale }: { event: Event; locale: Locale }) {
  return (
    <article className="event-card card">
      <div className="event-card-image">
        <Image
          src={event.image.url}
          alt={localize(event.image.alt, locale)}
          fill
          sizes="(max-width: 760px) 100vw, 33vw"
        />
      </div>
      <div className="event-card-body">
        <span className="pill">{localize(event.type, locale)}</span>
        <h3>{localize(event.title, locale)}</h3>
        <div className="metadata">
          <span>{formatDateRange(event.startDate, event.endDate, locale)}</span>
          <span>
            {localize(event.city, locale)}, {localize(event.country, locale)}
          </span>
        </div>
        <p>{localize(event.shortDescription, locale)}</p>
        <Link className="text-link" href={`/${locale}/events/${event.slug}`}>
          {locale === "ar" ? "تفاصيل الفعالية ←" : "Event details →"}
        </Link>
      </div>
    </article>
  );
}
