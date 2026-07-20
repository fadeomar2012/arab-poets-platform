import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Gallery } from "@/components/gallery/Gallery";
import { PageHero } from "@/components/ui/PageHero";
import { isLocale } from "@/i18n/config";
import { getGalleryItems } from "@/lib/content";

export const revalidate = 300;
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> { const { locale } = await params; return { title: locale === "ar" ? "معرض الصور" : "Gallery" }; }
export default async function GalleryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params; if (!isLocale(raw)) notFound(); const items = await getGalleryItems(raw);
  const images = items.filter((item, index, all) => all.findIndex((other) => other.url === item.url) === index);
  return <main><PageHero eyebrow={raw === "ar" ? "الأرشيف البصري" : "Visual archive"} title={raw === "ar" ? "معرض الصور" : "Gallery"} description={raw === "ar" ? "مختارات موثقة من الفعاليات، مع عنوان الفعالية والتاريخ والبيانات المتاحة لكل صورة." : "Documented moments from events, connected to their titles, dates, and available credits."} /><section className="section"><div className="container">{images.length ? <Gallery images={images} locale={raw} /> : <div className="empty-state card"><h2>{raw === "ar" ? "لا توجد صور منشورة بعد" : "No published images yet"}</h2></div>}</div></section></main>;
}
