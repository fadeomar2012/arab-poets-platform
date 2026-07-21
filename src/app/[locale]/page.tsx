import Image from "@/components/ui/SmartImage";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventCalendar } from "@/components/events/EventCalendar";
import { EventCard } from "@/components/events/EventCard";
import { Gallery } from "@/components/gallery/Gallery";
import { PersonCard } from "@/components/people/PersonCard";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { isLocale } from "@/i18n/config";
import { draftMode } from "next/headers";
import { getDictionary } from "@/i18n/dictionaries";
import { getEvents, getGalleryItems, getHomepageSettings, getPartnersBySlugs, getPeople, getPeopleBySlugs } from "@/lib/content";
import { localize } from "@/lib/content/types";
import { formatDateRange } from "@/lib/format";

export const revalidate = 300;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params; if (!isLocale(raw)) notFound();
  const locale = raw; const d = getDictionary(locale);
  const { isEnabled: preview } = await draftMode();
  const [events, allPeople, homepage, galleryItems] = await Promise.all([getEvents(locale), getPeople(locale), getHomepageSettings(locale, preview), getGalleryItems(locale)]);
  const current = events.filter((event) => event.status !== "past").sort((a,b) => +new Date(a.startDate) - +new Date(b.startDate));
  const configured = homepage?.featuredEventSlug ? events.find((event) => event.slug === homepage.featuredEventSlug) : undefined;
  const heroEvent = homepage?.heroMode === "institutional" ? undefined : homepage?.heroMode === "featuredEvent" ? configured : events.find((event) => event.featured && event.status !== "past") || current[0];
  const [featuredPeople, partners] = await Promise.all([
    homepage?.featuredPeopleSlugs?.length ? getPeopleBySlugs(homepage.featuredPeopleSlugs, locale) : Promise.resolve(allPeople.slice(0, 4)),
    homepage?.selectedPartnerSlugs?.length ? getPartnersBySlugs(homepage.selectedPartnerSlugs, locale) : Promise.resolve([]),
  ]);
  const title = homepage?.institutionalTitle ? localize(homepage.institutionalTitle, locale) : locale === "ar" ? "نعيش لفكرة حرة، ونبني جسورًا للقصيدة العربية" : "A free idea, building bridges for Arabic poetry";
  const description = homepage?.institutionalDescription ? localize(homepage.institutionalDescription, locale) : locale === "ar" ? "منصة ثقافية تجمع الشعراء والجمهور وتوثّق الفعاليات الأدبية في مدن عربية وأوروبية." : "A cultural platform connecting poets and audiences and documenting literary events across Arab and European cities.";
  const uniqueCountries = new Set(events.map((event) => localize(event.country, locale))).size;
  const statistics = homepage?.statistics?.length ? homepage.statistics : [
    { value: `${events.length}+`, label: { ar: "فعالية موثقة", en: "Documented events" } },
    { value: `${allPeople.length}+`, label: { ar: "شاعر وأديب", en: "Poets and writers" } },
    { value: `${uniqueCountries}+`, label: { ar: "دول ومجتمعات", en: "Countries and communities" } },
    { value: "2", label: { ar: "لغات للموقع", en: "Website languages" } },
  ];
  const gallery = galleryItems.filter((item, index, items) => items.findIndex((other) => other.url === item.url) === index).slice(0, 4);
  const heroImage = heroEvent?.image.url || homepage?.institutionalImage?.url || "/images/association-photo.png";
  const base = `/${locale}`;

  return <main>
    <section className="home-hero"><div className="home-hero-pattern" aria-hidden="true" /><div className="container hero-grid">
      <div className="hero-copy reveal"><span className="eyebrow"><Icon name="sparkle" />{heroEvent ? (locale === "ar" ? "فعالية مميزة" : "Featured event") : (locale === "ar" ? "الجمعية الدولية للشعراء العرب" : "International Association of Arab Poets")}</span><h1>{heroEvent ? localize(heroEvent.title, locale) : title}</h1><p>{heroEvent ? localize(heroEvent.shortDescription, locale) : description}</p>{heroEvent ? <div className="hero-facts"><span><Icon name="calendar" />{formatDateRange(heroEvent.startDate, heroEvent.endDate, locale)}</span><span><Icon name="location" />{localize(heroEvent.city, locale)}, {localize(heroEvent.country, locale)}</span></div> : null}<div className="hero-actions"><Link className="button button-primary" href={heroEvent ? `${base}/events/${heroEvent.slug}` : `${base}/events`}>{heroEvent ? d.common.details : d.nav.events}<Icon name="arrow" /></Link><Link className="button button-outline" href={`${base}/about`}>{d.nav.about}</Link></div></div>
      <div className="hero-visual reveal"><div className="hero-image"><Image src={heroImage} alt={heroEvent ? localize(heroEvent.image.alt, locale) : title} fill priority sizes="(max-width:900px) 100vw, 44vw" /></div>{heroEvent ? <Link className="hero-event-summary" href={`${base}/events/${heroEvent.slug}`}><span>{localize(heroEvent.type, locale)}</span><strong>{locale === "ar" ? "اكتشف البرنامج والمشاركين" : "Explore the program and participants"}</strong><Icon name="arrow" /></Link> : null}</div>
    </div></section>

    {events.length ? <section className="section calendar-home-section"><div className="container"><SectionHeading eyebrow={locale === "ar" ? "الروزنامة الثقافية" : "Cultural calendar"} title={locale === "ar" ? "اختر يومًا واكتشف الفعاليات" : "Choose a day and discover events"} description={locale === "ar" ? "روزنامة تفاعلية توضح الفعاليات الجارية والقادمة والأرشيفية." : "An interactive calendar for ongoing, upcoming, and archived events."} action={<ArrowLink href={`${base}/events`}>{d.common.viewAll}</ArrowLink>} /><EventCalendar events={events} locale={locale} compact /></div></section> : null}

    <section className="section section-soft"><div className="container"><SectionHeading title={locale === "ar" ? "الجمعية في أرقام" : "The association in numbers"} /><div className="stats-grid">{statistics.slice(0,4).map((stat) => <div key={`${stat.value}-${localize(stat.label,locale)}`}><strong>{stat.value}</strong><span>{localize(stat.label,locale)}</span></div>)}</div></div></section>

    {current.length ? <section className="section"><div className="container"><SectionHeading title={d.common.upcoming} description={locale === "ar" ? "ملتقيات وأمسيات وبرامج تجمع الشعراء والجمهور." : "Forums, readings, and programs connecting poets and audiences."} action={<ArrowLink href={`${base}/events`}>{d.common.viewAll}</ArrowLink>} /><div className="events-grid">{current.slice(0,3).map((event) => <EventCard event={event} locale={locale} key={event.slug} />)}</div></div></section> : null}

    {featuredPeople.length ? <section className="section section-soft"><div className="container"><SectionHeading title={d.nav.people} description={locale === "ar" ? "ملفات ثقافية توثق التجارب والمشاركات والأعمال الأدبية." : "Editorial profiles documenting cultural work and participation."} action={<ArrowLink href={`${base}/people`}>{d.common.viewAll}</ArrowLink>} /><div className="people-grid">{featuredPeople.slice(0,4).map((person) => <PersonCard person={person} locale={locale} key={person.slug} />)}</div></div></section> : null}

    {gallery.length ? <section className="section"><div className="container"><SectionHeading title={d.nav.gallery} description={locale === "ar" ? "صور مرتبطة بفعالياتها ومعلوماتها الأصلية." : "Images connected to their events and original context."} action={<ArrowLink href={`${base}/gallery`}>{d.common.viewAll}</ArrowLink>} /><Gallery images={gallery} locale={locale} preview /></div></section> : null}

    {partners.length ? <section className="section section-soft partners-section"><div className="container"><SectionHeading title={locale === "ar" ? "شركاؤنا" : "Our partners"} description={locale === "ar" ? "مؤسسات ثقافية وإعلامية تساهم في بناء جسور التعاون." : "Cultural and media organizations helping build lasting collaboration."} /><div className="partners-grid">{partners.map((partner) => { const content = <>{partner.logo ? <span className="partner-logo"><Image src={partner.logo.url} alt={localize(partner.logo.alt, locale)} fill sizes="180px" /></span> : <span className="partner-monogram">{localize(partner.name, locale).slice(0, 2)}</span>}<strong>{localize(partner.name, locale)}</strong></>; return partner.website ? <a className="partner-card card" href={partner.website} target="_blank" rel="noopener noreferrer" key={partner.slug}>{content}<Icon name="external" /></a> : <div className="partner-card card" key={partner.slug}>{content}</div>; })}</div></div></section> : null}

    <section className="section"><div className="container"><div className="participation-cta"><div><span className="eyebrow">{locale === "ar" ? "شارك صوتك" : "Share your voice"}</span><h2>{locale === "ar" ? "هل ترغب في المشاركة في إحدى فعالياتنا؟" : "Would you like to participate in one of our events?"}</h2><p>{locale === "ar" ? "أرسل طلبًا أوليًا، وسيتواصل فريق الجمعية معك." : "Send an initial request and the association team will contact you."}</p></div><Link className="button button-primary" href={`${base}/participate`}>{d.nav.participate}<Icon name="arrow" /></Link></div></div></section>
  </main>;
}
