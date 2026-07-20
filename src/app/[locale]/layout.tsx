import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import "../globals.css";
import { direction, isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getSiteSettings } from "@/lib/content";

export function generateStaticParams() { return locales.map((locale) => ({ locale })); }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const d = getDictionary(raw);
  const base = process.env.URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return { metadataBase: new URL(base), title: { default: d.associationName, template: `%s | ${d.associationName}` }, description: raw === "ar" ? "منصة الجمعية الدولية للشعراء العرب للفعاليات والشعراء والأرشيف الثقافي." : "The events, people, and cultural archive platform of the International Association of Arab Poets." };
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const settings = await getSiteSettings(raw);
  return <html lang={raw} dir={direction(raw)} data-scroll-behavior="smooth"><body><SiteHeader locale={raw} settings={settings} />{children}<SiteFooter locale={raw} settings={settings} /></body></html>;
}
