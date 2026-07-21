"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Person } from "@/lib/content/types";
import { localize } from "@/lib/content/types";
import { PersonCard } from "./PersonCard";

export function PeopleFilters({ people, locale }: { people: Person[]; locale: Locale }) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const roles = [...new Set(people.map((person) => localize(person.role, locale)))];
  const filtered = useMemo(() => people.filter((person) => {
    const text = `${localize(person.name, locale)} ${localize(person.country, locale)}`.toLowerCase();
    return (!query || text.includes(query.toLowerCase())) && (role === "all" || localize(person.role, locale) === role);
  }), [people, locale, query, role]);
  return <>
    <div className="filter-panel card filter-people"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={locale === "ar" ? "ابحث بالاسم" : "Search by name"} aria-label={locale === "ar" ? "ابحث بالاسم" : "Search by name"} /><select value={role} onChange={(event) => setRole(event.target.value)} aria-label={locale === "ar" ? "تصفية حسب الدور" : "Filter by role"}><option value="all">{locale === "ar" ? "كل الأدوار" : "All roles"}</option>{roles.map((item) => <option key={item}>{item}</option>)}</select><button className="button button-dark" onClick={() => { setQuery(""); setRole("all"); }}>{locale === "ar" ? "إعادة الضبط" : "Reset"}</button></div>
    {filtered.length ? <div className="people-grid">{filtered.map((person) => <PersonCard person={person} locale={locale} key={person.slug} />)}</div> : <div className="empty-state card"><span>☷</span><h2>{locale === "ar" ? "لا توجد ملفات مطابقة" : "No matching profiles"}</h2></div>}
  </>;
}
