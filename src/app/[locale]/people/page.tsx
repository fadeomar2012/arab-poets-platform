import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PeopleFilters } from "@/components/people/PeopleFilters";
import { PageHero } from "@/components/ui/PageHero";
import { isLocale } from "@/i18n/config";
import { getPeople } from "@/lib/content";
export const revalidate = 300;
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> { const { locale } = await params; return { title: locale === "ar" ? "الشعراء والأدباء" : "Poets & Writers" }; }
export default async function PeoplePage({ params }: { params: Promise<{ locale: string }> }) { const { locale: raw } = await params; if (!isLocale(raw)) notFound(); const people = await getPeople(raw); return <main><PageHero eyebrow={raw === "ar" ? "الدليل الثقافي" : "Cultural directory"} title={raw === "ar" ? "الشعراء والأدباء" : "Poets & Writers"} description={raw === "ar" ? "اكتشف ملفات الشعراء والكتّاب والفنانين والإعلاميين المشاركين في نشاط الجمعية." : "Discover profiles of poets, writers, artists, and media professionals involved with the association."} /><section className="section"><div className="container"><PeopleFilters people={people} locale={raw} /></div></section></main>; }
