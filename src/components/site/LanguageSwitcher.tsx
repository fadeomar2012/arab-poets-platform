"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const target = locale === "ar" ? "en" : "ar";
  const parts = pathname.split("/");
  parts[1] = target;
  const href = parts.join("/") || `/${target}`;

  return (
    <Link className="language-switcher" href={href} aria-label={target === "ar" ? "العربية" : "English"}>
      {target.toUpperCase()}
    </Link>
  );
}
