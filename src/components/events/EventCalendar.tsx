"use client";

import Image from "@/components/ui/SmartImage";
import Link from "next/link";
import type { CSSProperties, KeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Event, EventStatus } from "@/lib/content/types";
import { localize } from "@/lib/content/types";
import { attendanceLabel, formatDateRange } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";

type StatusFilter = "all" | EventStatus;
const palette = ["#B88A2C", "#28745B", "#8B476B", "#2F6EA5", "#A4582C", "#655AA5"];

function dateKeyInTimeZone(iso: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timeZone || "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(iso));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
function monthKey(date: Date) { return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`; }
function parseMonth(value: string) { const [year, month] = value.split("-").map(Number); return new Date(Date.UTC(year, month - 1, 1)); }
function addMonths(date: Date, amount: number) { return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1)); }
function dayKeys(event: Event) {
  const start = dateKeyInTimeZone(event.startDate, event.timezone);
  const end = dateKeyInTimeZone(event.endDate || event.startDate, event.timezone);
  const keys: string[] = [];
  const cursor = new Date(`${start}T00:00:00Z`); const last = new Date(`${end}T00:00:00Z`);
  while (cursor <= last && keys.length < 370) { keys.push(cursor.toISOString().slice(0, 10)); cursor.setUTCDate(cursor.getUTCDate() + 1); }
  return keys;
}
function monthLabel(date: Date, locale: Locale) { return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", { month: "long", year: "numeric", timeZone: "UTC" }).format(date); }
function dayLabel(key: string, locale: Locale) { return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${key}T00:00:00Z`)); }
function eventTypeKey(event: Event, locale: Locale) { return event.typeSlug || localize(event.type, locale); }
function daysInMonth(monthValue: string) { const d = parseMonth(monthValue); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate(); }
function shiftDay(dateKey: string, amount: number) { const d = new Date(`${dateKey}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + amount); return d.toISOString().slice(0, 10); }

export type EventFacets = {
  countries: string[];
  cities: { country: string; city: string }[];
  types: { key: string; label: string; color?: string; showInLegend: boolean }[];
};

// Visible calendar grid range [from, to] as YYYY-MM-DD, including the
// leading/trailing days of adjacent months shown in the six-week grid.
function gridRange(monthValue: string) {
  const start = parseMonth(monthValue);
  const firstDay = start.getUTCDay();
  const total = firstDay + daysInMonth(monthValue);
  const padded = total + ((7 - (total % 7)) % 7);
  const from = new Date(start); from.setUTCDate(1 - firstDay);
  const to = new Date(from); to.setUTCDate(from.getUTCDate() + padded - 1);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export function EventCalendar({ events, locale, compact = false, facets }: { events: Event[]; locale: Locale; compact?: boolean; facets?: EventFacets }) {
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const initialEvent = events.find((event) => event.status !== "past") || events[0];
  const initialDate = initialEvent ? dateKeyInTimeZone(initialEvent.startDate, initialEvent.timezone) : todayKey;
  const [month, setMonth] = useState(monthKey(new Date(`${initialDate}T00:00:00Z`)));
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [query, setQuery] = useState(""); const [status, setStatus] = useState<StatusFilter>("all"); const [type, setType] = useState("all"); const [country, setCountry] = useState("all"); const [city, setCity] = useState("all");
  const [urlReady, setUrlReady] = useState(compact);
  const [filtersOpen, setFiltersOpen] = useState(false);
  // The calendar loads only the events overlapping the visible month grid.
  // `loaded` is seeded from the server-rendered initial range and grows as the
  // user navigates; new months are fetched from the scoped public endpoint.
  const [loaded, setLoaded] = useState<Map<string, Event>>(() => new Map(events.map((event) => [event.slug, event])));
  const [rangeLoading, setRangeLoading] = useState(false);
  const [rangeError, setRangeError] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const loadedRanges = useRef<Set<string>>(new Set());
  const dayRefs = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocus = useRef<string | null>(null);
  // Controls whether the next URL sync creates a history entry (pushState, for
  // discrete navigation like month/date/filter changes) or replaces the current
  // one (replaceState, for search typing and initial/popstate normalization).
  const historyMode = useRef<"push" | "replace">("replace");

  const allEvents = useMemo(() => [...loaded.values()], [loaded]);

  // Fetch the events overlapping the visible grid range when the month changes
  // (full calendar only — the compact homepage widget keeps its seeded set).
  // Rapid month switches abort the stale request so only the latest range wins.
  useEffect(() => {
    if (compact) return;
    const { from, to } = gridRange(month);
    const key = `${from}:${to}:${locale}`;
    if (loadedRanges.current.has(key)) return;
    const controller = new AbortController();
    setRangeLoading(true); setRangeError(false);
    fetch(`/api/public/events?from=${from}&to=${to}&locale=${locale}`, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error("range request failed"); return response.json(); })
      .then((data: { events: Event[] }) => {
        loadedRanges.current.add(key);
        setLoaded((prev) => { const next = new Map(prev); for (const event of data.events) next.set(event.slug, event); return next; });
        setRangeLoading(false);
      })
      .catch((error) => { if (controller.signal.aborted) return; console.error("Calendar range load failed", error); setRangeLoading(false); setRangeError(true); });
    return () => controller.abort();
  }, [compact, month, locale, reloadNonce]);

  const retryRange = () => { loadedRanges.current.delete(`${gridRange(month).from}:${gridRange(month).to}:${locale}`); setReloadNonce((value) => value + 1); };

  const typeOptions = useMemo(() => {
    if (facets?.types.length) {
      return facets.types.map((item, index) => ({ key: item.key, label: item.label, color: item.color || palette[index % palette.length], showInLegend: item.showInLegend }));
    }
    const seen = new Map<string, { key: string; label: string; color: string; showInLegend: boolean }>();
    allEvents.forEach((event, index) => {
      const key = eventTypeKey(event, locale);
      if (!seen.has(key)) seen.set(key, { key, label: localize(event.type, locale), color: event.typeColor || palette[index % palette.length], showInLegend: event.typeShowInLegend !== false });
    });
    return [...seen.values()];
  }, [facets, allEvents, locale]);
  const typeColors = useMemo(() => new Map(typeOptions.map((item) => [item.key, item.color])), [typeOptions]);

  const filtered = useMemo(() => allEvents.filter((event) => {
    const text = `${localize(event.title, locale)} ${localize(event.shortDescription, locale)} ${localize(event.city, locale)} ${localize(event.country, locale)}`.toLowerCase();
    return (!query || text.includes(query.toLowerCase())) && (status === "all" || event.status === status) && (type === "all" || eventTypeKey(event, locale) === type) && (country === "all" || localize(event.country, locale) === country) && (city === "all" || localize(event.city, locale) === city);
  }), [allEvents, locale, query, status, type, country, city]);
  const eventsByDay = useMemo(() => { const map = new Map<string, Event[]>(); filtered.forEach((event) => dayKeys(event).forEach((key) => map.set(key, [...(map.get(key) || []), event]))); return map; }, [filtered]);

  const monthDate = parseMonth(month); const firstDay = monthDate.getUTCDay(); const days = daysInMonth(month);
  const cells = Array.from({ length: firstDay + days }, (_, index) => index < firstDay ? null : index - firstDay + 1);
  // Pad to whole weeks so each ARIA row has exactly 7 cells (grid > row > gridcell).
  const paddedCells = [...cells, ...Array.from({ length: (7 - (cells.length % 7)) % 7 }, () => null)];
  const weeks = Array.from({ length: paddedCells.length / 7 }, (_, i) => paddedCells.slice(i * 7, i * 7 + 7));
  const selectedEvents = eventsByDay.get(selectedDate) || [];
  const countries = facets?.countries.length
    ? facets.countries
    : [...new Set(allEvents.map((event) => localize(event.country, locale)).filter(Boolean))].sort();
  // Cities are scoped to the selected country when one is active, otherwise all.
  const cities = facets?.cities.length
    ? [...new Set(facets.cities.filter((item) => country === "all" || item.country === country).map((item) => item.city).filter(Boolean))].sort()
    : [...new Set(allEvents.filter((event) => country === "all" || localize(event.country, locale) === country).map((event) => localize(event.city, locale)).filter(Boolean))].sort();
  const hasFilters = Boolean(query || status !== "all" || type !== "all" || country !== "all" || city !== "all");
  // Marks the next URL sync as a discrete navigation action (adds a history entry).
  const pushNext = () => { historyMode.current = "push"; };
  const reset = () => { pushNext(); setQuery(""); setStatus("all"); setType("all"); setCountry("all"); setCity("all"); };
  const moveMonth = (amount: number) => { pushNext(); const next = addMonths(monthDate, amount); setMonth(monthKey(next)); setSelectedDate(`${monthKey(next)}-01`); };
  const weekdays = locale === "ar" ? ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Selecting a day always keeps the calendar month in sync with that day.
  // Clicking a day is discrete navigation (push); roving keyboard arrows pass
  // push=false so holding a direction does not flood the history stack.
  const selectDay = useCallback((key: string, push = true) => { if (push) historyMode.current = "push"; setSelectedDate(key); setMonth(key.slice(0, 7)); }, []);

  // Roving keyboard navigation across the day grid. Left/Right respect reading
  // direction; Up/Down move by a week; Home/End jump within the month.
  const onGridKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const rtl = locale === "ar";
    const map: Record<string, number> = {
      ArrowRight: rtl ? -1 : 1,
      ArrowLeft: rtl ? 1 : -1,
      ArrowDown: 7,
      ArrowUp: -7,
    };
    let target: string | null = null;
    if (event.key in map) target = shiftDay(selectedDate, map[event.key]);
    else if (event.key === "Home") target = `${month}-01`;
    else if (event.key === "End") target = `${month}-${String(days).padStart(2, "0")}`;
    else if (event.key === "PageDown") { moveMonth(1); event.preventDefault(); return; }
    else if (event.key === "PageUp") { moveMonth(-1); event.preventDefault(); return; }
    if (!target) return;
    event.preventDefault();
    pendingFocus.current = target;
    // Roving arrow/Home/End movement replaces rather than pushes, so a burst of
    // key presses does not create dozens of history entries.
    selectDay(target, false);
  };

  // After a keyboard move re-renders, move focus onto the newly selected day.
  useEffect(() => {
    if (!pendingFocus.current) return;
    const button = dayRefs.current.get(pendingFocus.current);
    if (button) button.focus();
    pendingFocus.current = null;
  }, [selectedDate, month]);

  const readParams = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const date = params.get("date");
    const requestedMonth = params.get("month");
    const requestedStatus = params.get("status");
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) { setSelectedDate(date); setMonth(date.slice(0, 7)); }
    else if (requestedMonth && /^\d{4}-\d{2}$/.test(requestedMonth)) { setMonth(requestedMonth); setSelectedDate(`${requestedMonth}-01`); }
    setQuery(params.get("q") || "");
    setCountry(params.get("country") || "all");
    setCity(params.get("city") || "all");
    setType(params.get("type") || "all");
    setStatus(requestedStatus === "upcoming" || requestedStatus === "ongoing" || requestedStatus === "past" ? requestedStatus : "all");
  }, []);

  useEffect(() => {
    if (compact) return;
    const frame = window.requestAnimationFrame(() => { readParams(); setUrlReady(true); });
    // Restore state when the user navigates with the browser back/forward
    // buttons. The browser has already changed window.location for us, so the
    // sync effect below sees the rebuilt URL match the current one and does not
    // write a new entry (it never overwrites the restored URL).
    const onPop = () => { historyMode.current = "replace"; readParams(); };
    window.addEventListener("popstate", onPop);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener("popstate", onPop); };
  }, [compact, readParams]);

  useEffect(() => {
    if (compact || !urlReady) return;
    const params = new URLSearchParams(window.location.search);
    params.set("month", month);
    params.set("date", selectedDate);
    if (query) params.set("q", query); else params.delete("q");
    if (status !== "all") params.set("status", status); else params.delete("status");
    if (type !== "all") params.set("type", type); else params.delete("type");
    if (country !== "all") params.set("country", country); else params.delete("country");
    if (city !== "all") params.set("city", city); else params.delete("city");
    const search = params.toString();
    const next = `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    // No history entry for equivalent state (also makes popstate restoration a
    // no-op instead of clobbering the URL the browser just restored).
    if (next === current) { historyMode.current = "replace"; return; }
    if (historyMode.current === "push") window.history.pushState(null, "", next);
    else window.history.replaceState(null, "", next);
    // Default back to replace; only explicit discrete actions opt into push.
    historyMode.current = "replace";
  }, [compact, city, country, month, query, selectedDate, status, type, urlReady]);

  const countLabel = locale === "ar" ? `${filtered.length} فعالية مطابقة` : `${filtered.length} matching ${filtered.length === 1 ? "event" : "events"}`;

  return (
    <div className={compact ? "event-calendar event-calendar--compact" : "event-calendar"}>
      {!compact ? <>
        <div className="calendar-toolbar">
          <button className="button button-dark button-small calendar-filters-toggle" type="button" aria-expanded={filtersOpen} aria-controls="calendar-filters" onClick={() => setFiltersOpen((open) => !open)}><Icon name="filter" />{locale === "ar" ? "عوامل التصفية" : "Filters"}{hasFilters ? <b className="filter-badge" aria-hidden /> : null}</button>
          <p className="calendar-result-count" role="status" aria-live="polite">{countLabel}</p>
        </div>
        <div className={`calendar-filters card${filtersOpen ? " is-open" : ""}`} id="calendar-filters">
          <label className="calendar-search"><Icon name="search" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={locale === "ar" ? "ابحث عن فعالية..." : "Search events..."} aria-label={locale === "ar" ? "ابحث عن فعالية" : "Search events"} /></label>
          <select value={country} onChange={(e) => { pushNext(); setCountry(e.target.value); setCity("all"); }} aria-label={locale === "ar" ? "الدولة" : "Country"}><option value="all">{locale === "ar" ? "كل الدول" : "All countries"}</option>{countries.map((item) => <option value={item} key={item}>{item}</option>)}</select>
          <select value={city} onChange={(e) => { pushNext(); setCity(e.target.value); }} aria-label={locale === "ar" ? "المدينة" : "City"} disabled={cities.length === 0}><option value="all">{locale === "ar" ? "كل المدن" : "All cities"}</option>{cities.map((item) => <option value={item} key={item}>{item}</option>)}</select>
          <select value={type} onChange={(e) => { pushNext(); setType(e.target.value); }} aria-label={locale === "ar" ? "النوع" : "Type"}><option value="all">{locale === "ar" ? "كل الأنواع" : "All types"}</option>{typeOptions.map((item) => <option value={item.key} key={item.key}>{item.label}</option>)}</select>
          <select value={status} onChange={(e) => { pushNext(); setStatus(e.target.value as StatusFilter); }} aria-label={locale === "ar" ? "الحالة" : "Status"}><option value="all">{locale === "ar" ? "كل التواريخ" : "All dates"}</option><option value="upcoming">{locale === "ar" ? "قادمة" : "Upcoming"}</option><option value="ongoing">{locale === "ar" ? "جارية" : "Ongoing"}</option><option value="past">{locale === "ar" ? "سابقة" : "Past"}</option></select>
          {hasFilters ? <button className="button button-dark button-small" onClick={reset} type="button">{locale === "ar" ? "إعادة الضبط" : "Reset"}</button> : null}
        </div>
      </> : null}
      <div className="calendar-layout">
        <section className="calendar-panel card">
          <div className="calendar-header"><button className="icon-button" onClick={() => moveMonth(-1)} aria-label={locale === "ar" ? "الشهر السابق" : "Previous month"}><Icon name="chevron" /></button><h2 aria-live="polite">{monthLabel(monthDate, locale)}</h2><button className="icon-button calendar-next" onClick={() => moveMonth(1)} aria-label={locale === "ar" ? "الشهر التالي" : "Next month"}><Icon name="chevron" /></button></div>
          {!compact && rangeError ? (
            <p className="calendar-range-error" role="alert">
              {locale === "ar" ? "تعذّر تحميل فعاليات هذا الشهر." : "Couldn’t load this month’s events."}
              <button type="button" className="button button-small button-dark" onClick={retryRange}>{locale === "ar" ? "إعادة المحاولة" : "Retry"}</button>
            </p>
          ) : null}
          {!compact && rangeLoading && !rangeError ? (
            <p className="calendar-range-status" role="status" aria-live="polite">{locale === "ar" ? "جارٍ تحميل الفعاليات…" : "Loading events…"}</p>
          ) : null}
          <div className="calendar-weekdays" aria-hidden>{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
          <div className="calendar-grid" role="grid" aria-label={monthLabel(monthDate, locale)} onKeyDown={onGridKeyDown}>{weeks.map((week, weekIndex) => (
            <div className="calendar-week" role="row" key={`week-${weekIndex}`}>{week.map((day, index) => {
              if (!day) return <span className="calendar-blank" role="gridcell" aria-hidden="true" key={`blank-${weekIndex}-${index}`} />;
              const key = `${month}-${String(day).padStart(2, "0")}`; const dayEvents = eventsByDay.get(key) || []; const selected = selectedDate === key; const today = key === todayKey;
              const typeNames = [...new Set(dayEvents.map((event) => localize(event.type, locale)))];
              const label = `${dayLabel(key, locale)}${dayEvents.length ? (locale === "ar" ? `، ${dayEvents.length} فعالية: ${typeNames.join("، ")}` : `, ${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""}: ${typeNames.join(", ")}`) : (locale === "ar" ? "، لا فعاليات" : ", no events")}`;
              return <button ref={(node) => { if (node) dayRefs.current.set(key, node); else dayRefs.current.delete(key); }} role="gridcell" className={`calendar-day ${selected ? "selected" : ""} ${today ? "today" : ""} ${dayEvents.length ? "has-events" : ""}`} key={key} onClick={() => selectDay(key)} type="button" tabIndex={selected ? 0 : -1} aria-selected={selected} aria-label={label}><span>{day}</span>{dayEvents.length ? <span className="calendar-dots" aria-hidden>{dayEvents.slice(0, 3).map((event, dotIndex) => <i key={`${event.slug}-${dotIndex}`} style={{ backgroundColor: typeColors.get(eventTypeKey(event, locale)) } as CSSProperties} />)}{dayEvents.length > 3 ? <b>+{dayEvents.length - 3}</b> : null}</span> : null}</button>;
            })}</div>
          ))}</div>
          <div className="calendar-legend">{typeOptions.filter((item) => item.showInLegend).slice(0, compact ? 4 : 8).map((item) => <span key={item.key}><i style={{ backgroundColor: item.color } as CSSProperties} />{item.label}</span>)}</div>
        </section>
        <aside className="day-events-panel card" aria-label={locale === "ar" ? "فعاليات اليوم المحدد" : "Selected day events"}><div className="day-events-heading"><div><span>{locale === "ar" ? "فعاليات اليوم المحدد" : "Selected day"}</span><h3 aria-live="polite">{dayLabel(selectedDate, locale)}</h3></div><strong aria-hidden>{selectedEvents.length}</strong></div>
          <div className="day-events-list">{selectedEvents.length ? selectedEvents.slice(0, compact ? 2 : 8).map((event) => <Link className="calendar-event-card" href={`/${locale}/events/${event.slug}`} key={event.slug}><div className="calendar-event-image"><Image src={event.image.url} alt={localize(event.image.alt, locale)} fill sizes="110px" /></div><div><span className="event-type-dot" style={{ "--event-color": typeColors.get(eventTypeKey(event, locale)) } as CSSProperties}>{localize(event.type, locale)}</span><h4>{localize(event.title, locale)}</h4><p><Icon name="clock" />{formatDateRange(event.startDate, event.endDate, locale)}</p><p><Icon name="location" />{localize(event.city, locale)}, {localize(event.country, locale)}</p><small>{attendanceLabel(event.attendance, locale)}</small></div></Link>) : <div className="calendar-empty"><Icon name="calendar" /><p>{locale === "ar" ? "لا توجد فعاليات في هذا اليوم. اختر يومًا يحمل نقطة ملوّنة." : "No events on this day. Select a day with a colored marker."}</p></div>}</div>
          {compact ? <Link className="arrow-link" href={`/${locale}/events`}><span>{locale === "ar" ? "عرض الروزنامة كاملة" : "View full calendar"}</span><Icon name="arrow" /></Link> : null}
        </aside>
      </div>
    </div>
  );
}
