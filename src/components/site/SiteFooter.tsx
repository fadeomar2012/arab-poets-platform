import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import type { SiteSettings } from "@/lib/content/types";
import { localize } from "@/lib/content/types";
import { Icon } from "@/components/ui/Icon";

const COPYRIGHT_YEAR = 2026;
const whatsappURL = (number?: string) => number ? `https://wa.me/${number.replace(/\D/g, "")}` : undefined;

export function SiteFooter({ locale, settings }: { locale: Locale; settings?: SiteSettings | null }) {
  const d = getDictionary(locale);
  const base = `/${locale}`;
  const name = settings?.associationName?.[locale] || d.associationName;
  const slogan = settings?.slogan ? localize(settings.slogan, locale) : d.slogan;
  const whatsapp = whatsappURL(settings?.whatsapp);
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-about"><h3>{name}</h3><p>{slogan}</p><p>{locale === "ar" ? "منصة ثقافية تجمع الشعراء وتوثّق الفعاليات وتبني جسورًا أدبية تتجاوز الحدود." : "A cultural platform connecting poets, documenting events, and building literary bridges across borders."}</p></div>
        <div><h4>{locale === "ar" ? "روابط" : "Links"}</h4><Link href={`${base}/about`}>{d.nav.about}</Link><Link href={`${base}/events`}>{d.nav.events}</Link><Link href={`${base}/people`}>{d.nav.people}</Link></div>
        <div><h4>{locale === "ar" ? "المشاركة" : "Participate"}</h4><Link href={`${base}/participate`}>{d.nav.participate}</Link><Link href={`${base}/gallery`}>{d.nav.gallery}</Link><Link href={`${base}/privacy`}>{locale === "ar" ? "سياسة الخصوصية" : "Privacy policy"}</Link></div>
        <div><h4>{d.nav.contact}</h4>{settings?.officialEmail ? <a href={`mailto:${settings.officialEmail}`}><Icon name="email" />{settings.officialEmail}</a> : null}{whatsapp ? <a href={whatsapp} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" />WhatsApp</a> : null}{settings?.socialLinks.map((link) => <a href={link.url} key={`${link.platform}-${link.url}`} target="_blank" rel="noopener noreferrer">{link.platform}</a>)}{!settings?.officialEmail && !whatsapp && !settings?.socialLinks?.length ? <Link href={`${base}/contact`}>{locale === "ar" ? "نموذج التواصل" : "Contact form"}</Link> : null}</div>
      </div>
      <div className="container footer-bottom">© {COPYRIGHT_YEAR} {name}</div>
    </footer>
  );
}
