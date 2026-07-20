import Image from "@/components/ui/SmartImage";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { Locale } from "@/i18n/config";
import type { Event } from "@/lib/content/types";
import { localize } from "@/lib/content/types";
import { formatDateRange } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";

export function EventCard({ event, locale, compact = false }: { event: Event; locale: Locale; compact?: boolean }) {
  return (
    <article className={`event-card card ${compact ? "event-card--compact" : ""}`} style={{ "--event-color": event.typeColor || "#B88A2C" } as CSSProperties}>
      <Link className="event-card-link" href={`/${locale}/events/${event.slug}`}>
        <div className="event-card-image">
          <Image src={event.image.url} alt={localize(event.image.alt, locale)} fill sizes="(max-width: 760px) 100vw, 33vw" />
          <span className={`event-status event-status--${event.status}`}>{event.status === "ongoing" ? (locale === "ar" ? "جارية الآن" : "Ongoing") : event.status === "past" ? (locale === "ar" ? "أرشيف" : "Archive") : (locale === "ar" ? "قادمة" : "Upcoming")}</span>
        </div>
        <div className="event-card-body">
          <span className="event-type-dot">{localize(event.type, locale)}</span>
          <h3>{localize(event.title, locale)}</h3>
          <div className="event-card-meta"><span><Icon name="calendar" />{formatDateRange(event.startDate, event.endDate, locale)}</span><span><Icon name="location" />{localize(event.city, locale)}, {localize(event.country, locale)}</span></div>
          {!compact ? <p>{localize(event.shortDescription, locale)}</p> : null}
          <span className="arrow-link"><span>{locale === "ar" ? "تفاصيل الفعالية" : "Event details"}</span><Icon className="arrow-link-icon" name="arrow" /></span>
        </div>
      </Link>
    </article>
  );
}
