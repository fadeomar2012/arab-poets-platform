import type { Metadata } from "next";
import Image from "@/components/ui/SmartImage";
import { notFound } from "next/navigation";
import { EventCard } from "@/components/events/EventCard";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Icon } from "@/components/ui/Icon";
import { isLocale } from "@/i18n/config";
import { getEvents, getPersonBySlug } from "@/lib/content";
import { localize } from "@/lib/content/types";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const person = await getPersonBySlug(slug, locale);
  return person
    ? {
        title: localize(person.name, locale),
        description: localize(person.shortBio, locale),
      }
    : {};
}

export default async function PersonPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const [person, events] = await Promise.all([getPersonBySlug(slug, raw), getEvents(raw)]);
  if (!person) notFound();
  const appearances = events.filter((event) => person.eventSlugs.includes(event.slug));

  return (
    <main>
      <section className="person-hero">
        <div className="container person-hero-grid">
          {person.image ? (
            <div className="profile-avatar profile-avatar-image">
              <Image
                src={person.image.url}
                alt={localize(person.image.alt, raw)}
                fill
                priority
                sizes="240px"
              />
            </div>
          ) : (
            <div className="profile-avatar">{localize(person.initials, raw)}</div>
          )}
          <div>
            <ArrowLink className="person-back-link" href={`/${raw}/people`}>{raw === "ar" ? "العودة إلى دليل الشعراء" : "Back to directory"}</ArrowLink>
            <span className="pill">{localize(person.role, raw)}</span>
            <h1>{localize(person.name, raw)}</h1>
            <p>{localize(person.shortBio, raw)}</p>
            <div className="metadata">
              <span>{localize(person.country, raw)}</span>
              <span>{appearances.length} {raw === "ar" ? "مشاركات" : "appearances"}</span>
              <span>{person.works.length} {raw === "ar" ? "أعمال" : "works"}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container profile-layout">
          <article>
            <h2>{raw === "ar" ? "السيرة الذاتية" : "Biography"}</h2>
            <p className="prose">{localize(person.fullBio, raw)}</p>

            {person.works.length ? (
              <section className="content-section">
                <h2>{raw === "ar" ? "الأعمال الأدبية" : "Literary works"}</h2>
                <div className="works-grid">
                  {person.works.map((work) => (
                    <article className="work-card card" key={localize(work.title, raw)}>
                      <div className="work-symbol"><Icon name="sparkle" /></div>
                      <div>
                        <span className="pill">{localize(work.type, raw)}</span>
                        <h3>{localize(work.title, raw)}</h3>
                        {work.year ? <p>{work.year}</p> : null}
                        {work.externalUrl ? (
                          <ArrowLink href={work.externalUrl} external>
                            {raw === "ar" ? "فتح العمل" : "Open work"}
                          </ArrowLink>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {appearances.length ? (
              <section className="content-section">
                <h2>{raw === "ar" ? "المشاركات السابقة" : "Previous appearances"}</h2>
                <div className="events-grid">
                  {appearances.map((event) => (
                    <EventCard event={event} locale={raw} key={event.slug} />
                  ))}
                </div>
              </section>
            ) : null}
          </article>

          <aside>
            <div className="sidebar-card card">
              <h3>{raw === "ar" ? "معلومات عامة" : "General information"}</h3>
              <dl>
                <div><dt>{raw === "ar" ? "الدولة" : "Country"}</dt><dd>{localize(person.country, raw)}</dd></div>
                <div><dt>{raw === "ar" ? "الصفة" : "Role"}</dt><dd>{localize(person.role, raw)}</dd></div>
              </dl>
              {person.website ? (
                <a
                  className="button button-dark button-full"
                  href={person.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {raw === "ar" ? "الموقع الشخصي" : "Personal website"}
                </a>
              ) : null}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
