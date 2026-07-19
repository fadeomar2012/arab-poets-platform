import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { PersonSummary } from "@/lib/content/types";
import { localize } from "@/lib/content/types";

export function PersonCard({ person, locale }: { person: PersonSummary; locale: Locale }) {
  return (
    <article className="person-card card">
      <div className="avatar" aria-hidden="true">{localize(person.initials, locale)}</div>
      <h3>{localize(person.name, locale)}</h3>
      <p>{localize(person.role, locale)} — {localize(person.country, locale)}</p>
      <Link className="text-link" href={`/${locale}/people/${person.slug}`}>{locale === "ar" ? "عرض الملف ←" : "View profile →"}</Link>
    </article>
  );
}
