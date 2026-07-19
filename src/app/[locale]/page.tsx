import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventCard } from "@/components/events/EventCard";
import { PersonCard } from "@/components/people/PersonCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getEvents, getPeople } from "@/lib/content";
import { localize } from "@/lib/content/types";
import { formatDateRange } from "@/lib/format";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw;
  const d = getDictionary(locale);
  const [events, people] = await Promise.all([getEvents(), getPeople()]);
  const upcoming = events.filter((event) => event.status === "upcoming").sort((a,b) => +new Date(a.startDate) - +new Date(b.startDate));
  const previous = events.filter((event) => event.status === "past").sort((a,b) => +new Date(b.startDate) - +new Date(a.startDate));
  const heroEvent = events.find((event) => event.featured && upcoming.includes(event)) ?? upcoming[0];
  const base = `/${locale}`;
  const gallery = [...new Set(events.flatMap((event) => event.gallery))].slice(0,4);

  return <main>
    <section className={`home-hero ${heroEvent ? "" : "institutional"}`}>
      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">{heroEvent ? (locale === "ar" ? "فعالية مميزة" : "Featured event") : (locale === "ar" ? "برامج جديدة قيد الإعداد" : "New programs in preparation")}</span>
          <h1>{heroEvent ? (locale === "ar" ? "لأنَّ الشعر يجمعنا، تتجاوز القصيدة حدود المكان" : "Poetry brings us together beyond borders") : (locale === "ar" ? "نواصل بناء جسور القصيدة العربية" : "We continue building bridges for Arabic poetry")}</h1>
          <p>{heroEvent ? (locale === "ar" ? "نحتفي بالشعر العربي ونفتح مساحة للقاء الشعراء والجمهور والمؤسسات الثقافية في مدن عربية وأوروبية." : "We celebrate Arabic poetry and create spaces for poets, audiences, and cultural institutions across Arab and European cities.") : (locale === "ar" ? "لا توجد فعالية قادمة معلنة حاليًا، لكن فريق الجمعية يعمل على برامج وملتقيات جديدة." : "There is no announced upcoming event at the moment, but the association is preparing new programs and forums.")}</p>
          <div className="hero-actions"><Link className="button button-primary" href={heroEvent ? `${base}/events/${heroEvent.slug}` : `${base}/events`}>{heroEvent ? d.common.details : d.common.previous}</Link><Link className="button button-outline" href={`${base}/about`}>{d.nav.about}</Link></div>
        </div>
        {heroEvent ? <article className="featured-event-card card"><div className="featured-image"><Image src={heroEvent.image} alt="" fill priority sizes="(max-width: 760px) 100vw, 420px" /></div><h2>{localize(heroEvent.title, locale)}</h2><div className="metadata"><span>{formatDateRange(heroEvent.startDate, heroEvent.endDate, locale)}</span><span>{localize(heroEvent.city, locale)}, {localize(heroEvent.country, locale)}</span></div><p>{localize(heroEvent.shortDescription, locale)}</p><Link className="button button-primary button-full" href={`${base}/events/${heroEvent.slug}`}>{d.common.details}</Link></article> : null}
      </div>
    </section>

    {upcoming.length ? <section className="section"><div className="container"><SectionHeading title={d.common.upcoming} description={locale === "ar" ? "ملتقيات وأمسيات وبرامج ثقافية تجمع الشعراء والجمهور." : "Forums, readings, and cultural programs connecting poets and audiences."} action={<Link className="text-link" href={`${base}/events`}>{d.common.viewAll} ←</Link>} /><div className="events-grid">{upcoming.slice(0,3).map((event) => <EventCard event={event} locale={locale} key={event.slug} />)}</div></div></section> : null}

    <section className="section section-soft"><div className="container"><SectionHeading title={locale === "ar" ? "عن الجمعية" : "About the association"} /><div className="stats-grid"><div><strong>20+</strong><span>{locale === "ar" ? "فعالية موثقة" : "Documented events"}</span></div><div><strong>300+</strong><span>{locale === "ar" ? "شاعر وأديب" : "Poets and writers"}</span></div><div><strong>8+</strong><span>{locale === "ar" ? "دول ومجتمعات" : "Countries and communities"}</span></div><div><strong>2</strong><span>{locale === "ar" ? "لغات للموقع" : "Website languages"}</span></div></div></div></section>

    <section className="section"><div className="container"><SectionHeading title={d.nav.people} description={locale === "ar" ? "ملفات ثقافية توثق المشاركات والأعمال الأدبية." : "Cultural profiles documenting participation and literary works."} action={<Link className="text-link" href={`${base}/people`}>{d.common.viewAll} ←</Link>} /><div className="people-grid">{people.slice(0,4).map((person) => <PersonCard person={person} locale={locale} key={person.slug} />)}</div></div></section>

    {previous.length ? <section className="section section-soft"><div className="container"><SectionHeading title={d.common.previous} /><div className="events-grid">{previous.slice(0,3).map((event) => <EventCard event={event} locale={locale} key={event.slug} />)}</div></div></section> : null}

    {gallery.length ? <section className="section"><div className="container"><SectionHeading title={d.nav.gallery} action={<Link className="text-link" href={`${base}/gallery`}>{d.common.viewAll} ←</Link>} /><div className="home-gallery">{gallery.map((image) => <div className="home-gallery-item" key={image}><Image src={image} alt="" fill sizes="(max-width: 700px) 50vw, 25vw" /></div>)}</div></div></section> : null}

    <section className="section"><div className="container"><div className="participation-cta"><div><h2>{locale === "ar" ? "هل ترغب في المشاركة في إحدى فعالياتنا؟" : "Would you like to participate in one of our events?"}</h2><p>{locale === "ar" ? "أرسل طلبًا أوليًا، وسيتواصل فريق الجمعية معك عبر البريد أو WhatsApp." : "Send an initial request and the team will contact you by email or WhatsApp."}</p></div><Link className="button button-primary" href={`${base}/participate`}>{d.nav.participate}</Link></div></div></section>
  </main>;
}
