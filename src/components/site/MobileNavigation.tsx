"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { Icon } from "@/components/ui/Icon";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function MobileNavigation({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const d = getDictionary(locale);
  const base = `/${locale}`;
  const links = [
    [base, d.nav.home],
    [`${base}/about`, d.nav.about],
    [`${base}/events`, d.nav.events],
    [`${base}/people`, d.nav.people],
    [`${base}/gallery`, d.nav.gallery],
    [`${base}/contact`, d.nav.contact],
  ];
  return (
    <div className="mobile-navigation">
      <button className="icon-button mobile-menu-button" type="button" aria-expanded={open} aria-label={locale === "ar" ? "فتح القائمة" : "Open menu"} onClick={() => setOpen((value) => !value)}>
        <Icon name={open ? "close" : "menu"} />
      </button>
      {open ? (
        <div className="mobile-menu-panel">
          <nav aria-label={locale === "ar" ? "التنقل الرئيسي" : "Main navigation"}>
            {links.map(([href, label]) => <Link className={pathname === href ? "active" : ""} href={href} key={href} onClick={() => setOpen(false)}>{label}</Link>)}
          </nav>
          <div className="mobile-menu-actions">
            <LanguageSwitcher locale={locale} />
            <Link className="button button-primary" href={`${base}/participate`} onClick={() => setOpen(false)}>{d.nav.participate}</Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
