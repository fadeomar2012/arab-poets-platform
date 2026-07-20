import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Gallery } from "@/components/gallery/Gallery";
import { isLocale } from "@/i18n/config";
import { getEvents } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: locale === "ar" ? "معرض الصور" : "Gallery" };
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const events = await getEvents(raw);
  const images = Array.from(
    new Map(
      events.flatMap((event) => event.gallery).map((image) => [image.url, image] as const),
    ).values(),
  );

  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <h1>{raw === "ar" ? "معرض الصور" : "Gallery"}</h1>
          <p>
            {raw === "ar"
              ? "مختارات موثقة من الفعاليات، مع بقاء كل صورة مرتبطة بمصدرها."
              : "Documented moments from events, with every image tied to its original source."}
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <Gallery images={images} locale={raw} />
        </div>
      </section>
    </main>
  );
}
