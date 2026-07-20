import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PeopleFilters } from "@/components/people/PeopleFilters";
import { isLocale } from "@/i18n/config";
import { getPeople } from "@/lib/content";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> { const { locale } = await params; return { title: locale === "ar" ? "الشعراء والأدباء" : "Poets & Writers" }; }
export default async function PeoplePage({ params }: { params: Promise<{ locale: string }> }) { const { locale: raw } = await params; if (!isLocale(raw)) notFound(); const people = await getPeople(raw); return <main><section className="page-hero"><div className="container"><h1>{raw === "ar" ? "الشعراء والأدباء" : "Poets & Writers"}</h1><p>{raw === "ar" ? "دليل عام للشعراء والكتّاب والفنانين والإعلاميين المشاركين في نشاط الجمعية." : "A directory of poets, writers, artists, and media professionals involved with the association."}</p></div></section><section className="section"><div className="container"><PeopleFilters people={people} locale={raw} /></div></section></main>; }
