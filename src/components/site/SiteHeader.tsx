import Image from "@/components/ui/SmartImage";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import type { SiteSettings } from "@/lib/content/types";
import { localize } from "@/lib/content/types";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileNavigation } from "./MobileNavigation";

export function SiteHeader({ locale, settings }: { locale: Locale; settings?: SiteSettings | null }) {
  const dictionary = getDictionary(locale);
  const base = `/${locale}`;
  const name = settings?.associationName?.[locale] || dictionary.associationName;
  const slogan = settings?.slogan ? localize(settings.slogan, locale) : dictionary.slogan;
  const logo = settings?.logo?.url || "/images/logo.png";
  const links = [
    [base, dictionary.nav.home],
    [`${base}/about`, dictionary.nav.about],
    [`${base}/events`, dictionary.nav.events],
    [`${base}/people`, dictionary.nav.people],
    [`${base}/gallery`, dictionary.nav.gallery],
    [`${base}/contact`, dictionary.nav.contact],
  ];

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" href={base}>
          <Image src={logo} alt="" width={58} height={58} priority />
          <span><strong>{name}</strong><small>{slogan}</small></span>
        </Link>
        <nav className="main-nav" aria-label={locale === "ar" ? "التنقل الرئيسي" : "Main navigation"}>
          {links.map(([href, label]) => <Link href={href} key={href}>{label}</Link>)}
        </nav>
        <div className="header-actions">
          <LanguageSwitcher locale={locale} />
          <Link className="button button-primary" href={`${base}/participate`}>{dictionary.nav.participate}</Link>
        </div>
        <MobileNavigation locale={locale} />
      </div>
    </header>
  );
}
