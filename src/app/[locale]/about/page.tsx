import type { Metadata } from "next";
import Image from "@/components/ui/SmartImage";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PersonCard } from "@/components/people/PersonCard";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { isLocale } from "@/i18n/config";
import { getHomepageSettings, getPeople, getPeopleBySlugs } from "@/lib/content";

export const revalidate = 300;
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> { const { locale } = await params; return { title: locale === "ar" ? "من نحن" : "About us" }; }

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params; if (!isLocale(raw)) notFound();
  const [allPeople, homepage] = await Promise.all([getPeople(raw), getHomepageSettings(raw)]);
  const team = homepage?.associationTeamSlugs?.length ? await getPeopleBySlugs(homepage.associationTeamSlugs, raw) : allPeople.slice(0,4);
  return <main>
    <PageHero eyebrow={raw === "ar" ? "الجمعية" : "The association"} title={raw === "ar" ? "من نحن" : "About us"} description={raw === "ar" ? "مؤسسة ثقافية تجمع الشعراء وتوثّق الحراك الأدبي وتبني مساحات للتبادل بين الثقافات." : "A cultural institution connecting poets, documenting literary activity, and creating spaces for cultural exchange."} />
    <section className="section"><div className="container about-grid"><div className="about-copy reveal"><span className="pill">{raw === "ar" ? "فكرة حرة" : "A free idea"}</span><h2>{raw === "ar" ? "نبني جسورًا للقصيدة العربية" : "Building bridges for Arabic poetry"}</h2><p className="prose">{raw === "ar" ? "تنظم الجمعية المهرجانات والملتقيات والأمسيات والبرامج الثقافية، وتربط الشعراء بالجمهور والمؤسسات، وتوثّق التجارب الأدبية للأجيال الحالية والقادمة. نؤمن بأن القصيدة مساحة للحوار، وأن التوثيق الجيد يحفظ الذاكرة الثقافية ويمنح التجارب الجديدة فرصة للظهور." : "The association organizes festivals, forums, poetry readings, and cultural programs. It connects poets with audiences and institutions while documenting literary experiences for current and future generations. We believe poetry creates dialogue and thoughtful documentation protects cultural memory."}</p><ArrowLink href={`/${raw}/events`}>{raw === "ar" ? "استكشف فعالياتنا" : "Explore our events"}</ArrowLink></div><div className="about-image reveal"><Image src="/images/association-photo.png" alt={raw === "ar" ? "صورة من نشاط الجمعية" : "An association activity"} fill sizes="(max-width:760px) 100vw, 50vw" /></div></div></section>
    <section className="section section-soft values-section"><div className="container"><SectionHeading title={raw === "ar" ? "ما الذي يقود عملنا؟" : "What guides our work?"} /><div className="values-grid"><article className="value-card card"><span><Icon name="sparkle" /></span><h3>{raw === "ar" ? "الرؤية" : "Vision"}</h3><p>{raw === "ar" ? "منصة دولية موثوقة للشعر العربي والتبادل الثقافي." : "A trusted international platform for Arabic poetry and cultural exchange."}</p></article><article className="value-card card"><span><Icon name="people" /></span><h3>{raw === "ar" ? "الرسالة" : "Mission"}</h3><p>{raw === "ar" ? "جمع الشعراء وتوثيق الفعاليات وإتاحة فرص للمشاركة والانتشار." : "Connect poets, document events, and create opportunities for participation and visibility."}</p></article><article className="value-card card"><span><Icon name="globe" /></span><h3>{raw === "ar" ? "القيم" : "Values"}</h3><p>{raw === "ar" ? "الحرية والأصالة والتنوع والاحترام والتواصل بين الثقافات." : "Freedom, authenticity, diversity, respect, and intercultural dialogue."}</p></article></div></div></section>
    {team.length ? <section className="section"><div className="container"><SectionHeading title={raw === "ar" ? "إدارة الجمعية" : "Association team"} description={raw === "ar" ? "الأشخاص المسؤولون عن توجيه البرامج وبناء الشراكات الثقافية." : "The people guiding programs and developing cultural partnerships."} /><div className="people-grid">{team.slice(0,4).map((person) => <PersonCard person={person} locale={raw} key={person.slug} />)}</div></div></section> : null}
    <section className="section"><div className="container"><div className="participation-cta"><div><h2>{raw === "ar" ? "لديك فكرة أو مقترح تعاون؟" : "Have an idea or partnership proposal?"}</h2><p>{raw === "ar" ? "تواصل معنا أو أرسل طلب مشاركة أوليًا." : "Contact us or submit an initial participation request."}</p></div><div className="cta-actions"><Link className="button button-primary" href={`/${raw}/contact`}>{raw === "ar" ? "تواصل معنا" : "Contact us"}</Link><Link className="button button-outline" href={`/${raw}/participate`}>{raw === "ar" ? "طلب المشاركة" : "Participate"}</Link></div></div></div></section>
  </main>;
}
