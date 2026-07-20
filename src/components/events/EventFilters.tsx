"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Event, EventStatus } from "@/lib/content/types";
import { localize } from "@/lib/content/types";
import { EventCard } from "./EventCard";

type StatusFilter = "all" | EventStatus;

export function EventFilters({ events, locale }: { events: Event[]; locale: Locale }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [type, setType] = useState("all");
  const types = [...new Set(events.map((event) => localize(event.type, locale)))];

  const filtered = useMemo(
    () =>
      events.filter((event) => {
        const text = `${localize(event.title, locale)} ${localize(event.shortDescription, locale)} ${localize(event.city, locale)}`.toLowerCase();
        return (
          (!query || text.includes(query.toLowerCase())) &&
          (status === "all" || event.status === status) &&
          (type === "all" || localize(event.type, locale) === type)
        );
      }),
    [events, locale, query, status, type],
  );

  function reset() {
    setQuery("");
    setStatus("all");
    setType("all");
  }

  return (
    <>
      <div className="filter-panel card">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={locale === "ar" ? "ابحث باسم الفعالية" : "Search events"}
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as StatusFilter)}
        >
          <option value="all">{locale === "ar" ? "كل التواريخ" : "All dates"}</option>
          <option value="upcoming">{locale === "ar" ? "قادمة" : "Upcoming"}</option>
          <option value="ongoing">{locale === "ar" ? "جارية الآن" : "Ongoing"}</option>
          <option value="past">{locale === "ar" ? "سابقة" : "Past"}</option>
        </select>
        <select value={type} onChange={(event) => setType(event.target.value)}>
          <option value="all">{locale === "ar" ? "كل الأنواع" : "All types"}</option>
          {types.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <button className="button button-dark" onClick={reset} type="button">
          {locale === "ar" ? "إعادة الضبط" : "Reset"}
        </button>
      </div>
      {filtered.length ? (
        <div className="events-grid">
          {filtered.map((event) => (
            <EventCard event={event} locale={locale} key={event.slug} />
          ))}
        </div>
      ) : (
        <div className="empty-state card">
          <span>⌕</span>
          <h2>{locale === "ar" ? "لا توجد نتائج مطابقة" : "No matching events"}</h2>
          <button className="button button-primary" onClick={reset} type="button">
            {locale === "ar" ? "إعادة ضبط الفلاتر" : "Reset filters"}
          </button>
        </div>
      )}
    </>
  );
}
