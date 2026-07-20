import Image from "@/components/ui/SmartImage";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { PersonSummary } from "@/lib/content/types";
import { localize } from "@/lib/content/types";
import { Icon } from "@/components/ui/Icon";

export function PersonCard({ person, locale, compact = false }: { person: PersonSummary; locale: Locale; compact?: boolean }) {
  return (
    <article className={`person-card card ${compact ? "person-card--compact" : ""}`}>
      <Link className="person-card-link" href={`/${locale}/people/${person.slug}`}>
        <div className="person-card-media">
          {person.image ? <Image src={person.image.url} alt={localize(person.image.alt, locale)} fill sizes="(max-width:760px) 100vw, 25vw" /> : <div className="person-placeholder" aria-hidden="true"><span>{localize(person.initials, locale)}</span></div>}
        </div>
        <div className="person-card-body"><span className="pill">{localize(person.role, locale)}</span><h3>{localize(person.name, locale)}</h3><p className="person-location"><Icon name="location" />{localize(person.country, locale)}</p>{!compact && person.shortBio ? <p className="person-bio">{localize(person.shortBio, locale)}</p> : null}<span className="arrow-link"><span>{locale === "ar" ? "عرض الملف" : "View profile"}</span><Icon className="arrow-link-icon" name="arrow" /></span></div>
      </Link>
    </article>
  );
}
