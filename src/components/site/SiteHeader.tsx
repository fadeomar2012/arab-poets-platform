import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function SiteHeader({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);
  const base = `/${locale}`;

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" href={base}>
          <Image src="/images/logo.png" alt="" width={58} height={58} priority />
          <span>
            <strong>{dictionary.associationName}</strong>
            <small>{dictionary.slogan}</small>
          </span>
        </Link>
        <nav className="main-nav" aria-label={locale === "ar" ? "التنقل الرئيسي" : "Main navigation"}>
          <Link href={base}>{dictionary.nav.home}</Link>
          <Link href={`${base}/about`}>{dictionary.nav.about}</Link>
          <Link href={`${base}/events`}>{dictionary.nav.events}</Link>
          <Link href={`${base}/people`}>{dictionary.nav.people}</Link>
          <Link href={`${base}/gallery`}>{dictionary.nav.gallery}</Link>
          <Link href={`${base}/contact`}>{dictionary.nav.contact}</Link>
        </nav>
        <div className="header-actions">
          <LanguageSwitcher locale={locale} />
          <Link className="button button-primary" href={`${base}/participate`}>
            {dictionary.nav.participate}
          </Link>
        </div>
        <details className="mobile-navigation">
          <summary aria-label={locale === "ar" ? "فتح القائمة" : "Open menu"}>☰</summary>
          <nav>
            <Link href={base}>{dictionary.nav.home}</Link>
            <Link href={`${base}/about`}>{dictionary.nav.about}</Link>
            <Link href={`${base}/events`}>{dictionary.nav.events}</Link>
            <Link href={`${base}/people`}>{dictionary.nav.people}</Link>
            <Link href={`${base}/gallery`}>{dictionary.nav.gallery}</Link>
            <Link href={`${base}/contact`}>{dictionary.nav.contact}</Link>
            <Link href={`${base}/participate`}>{dictionary.nav.participate}</Link>
            <LanguageSwitcher locale={locale} />
          </nav>
        </details>
      </div>
    </header>
  );
}
