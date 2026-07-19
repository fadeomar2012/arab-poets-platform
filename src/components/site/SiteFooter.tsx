import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

const COPYRIGHT_YEAR = 2026;

export function SiteFooter({ locale }: { locale: Locale }) {
  const d = getDictionary(locale);
  const base = `/${locale}`;
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <h3>{d.associationName}</h3>
          <p>{locale === "ar" ? "منصة ثقافية تجمع الشعراء وتوثّق الفعاليات وتبني جسورًا أدبية تتجاوز الحدود." : "A cultural platform connecting poets, documenting events, and building literary bridges across borders."}</p>
        </div>
        <div><h4>{locale === "ar" ? "روابط" : "Links"}</h4><Link href={`${base}/about`}>{d.nav.about}</Link><Link href={`${base}/events`}>{d.nav.events}</Link><Link href={`${base}/people`}>{d.nav.people}</Link></div>
        <div><h4>{locale === "ar" ? "المشاركة" : "Participate"}</h4><Link href={`${base}/participate`}>{d.nav.participate}</Link><Link href={`${base}/gallery`}>{d.nav.gallery}</Link><Link href={`${base}/privacy`}>{locale === "ar" ? "سياسة الخصوصية" : "Privacy policy"}</Link></div>
        <div><h4>{d.nav.contact}</h4><a href="mailto:info@example.org">info@example.org</a><a href="#">WhatsApp</a><a href="https://www.facebook.com/internationalarabpoets">Facebook</a></div>
      </div>
      <div className="container footer-bottom">© {COPYRIGHT_YEAR} {d.associationName}</div>
    </footer>
  );
}
