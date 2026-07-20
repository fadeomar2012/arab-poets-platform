"use client";

import Image from "@/components/ui/SmartImage";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
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

export function EventCalendar({ events, locale, compact = false }: { events: Event[]; locale: Locale; compact?: boolean }) {
  const now = new Date();
  const initialEvent = events.find((event) => event.status !== "past") || events[0];
  const initialDate = initialEvent ? dateKeyInTimeZone(initialEvent.startDate, initialEvent.timezone) : now.toISOString().slice(0, 10);
  const [month, setMonth] = useState(monthKey(new Date(`${initialDate}T00:00:00Z`)));
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [query, setQuery] = useState(""); const [status, setStatus] = useState<StatusFilter>("all"); const [type, setType] = useState("all"); const [country, setCountry] = useState("all");
  const [urlReady, setUrlReady] = useState(compact);
  const typeOptions = useMemo(() => {
    const seen = new Map<string, { key: string; label: string; color: string; showInLegend: boolean }>();
    events.forEach((event, index) => {
      const key = eventTypeKey(event, locale);
      if (!seen.has(key)) seen.set(key, { key, label: localize(event.type, locale), color: event.typeColor || palette[index % palette.length], showInLegend: event.typeShowInLegend !== false });
    });
    return [...seen.values()];
  }, [events, locale]);
  const typeColors = useMemo(() => new Map(typeOptions.map((item) => [item.key, item.color])), [typeOptions]);
  const filtered = useMemo(() => events.filter((event) => {
    const text = `${localize(event.title, locale)} ${localize(event.shortDescription, locale)} ${localize(event.city, locale)} ${localize(event.country, locale)}`.toLowerCase();
    return (!query || text.includes(query.toLowerCase())) && (status === "all" || event.status === status) && (type === "all" || eventTypeKey(event, locale) === type) && (country === "all" || localize(event.country, locale) === country);
  }), [events, locale, query, status, type, country]);
  const eventsByDay = useMemo(() => { const map = new Map<string, Event[]>(); filtered.forEach((event) => dayKeys(event).forEach((key) => map.set(key, [...(map.get(key) || []), event]))); return map; }, [filtered]);
  const monthDate = parseMonth(month); const firstDay = monthDate.getUTCDay(); const days = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + 1, 0)).getUTCDate();
  const cells = Array.from({ length: firstDay + days }, (_, index) => index < firstDay ? null : index - firstDay + 1);
  const selectedEvents = eventsByDay.get(selectedDate) || [];
  const countries = [...new Set(events.map((event) => localize(event.country, locale)).filter(Boolean))];
  const hasFilters = Boolean(query || status !== "all" || type !== "all" || country !== "all");
  const reset = () => { setQuery(""); setStatus("all"); setType("all"); setCountry("all"); };
  const moveMonth = (amount: number) => { const next = addMonths(monthDate, amount); setMonth(monthKey(next)); const key = `${monthKey(next)}-01`; setSelectedDate(key); };
  const weekdays = locale === "ar" ? ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  useEffect(() => {
    if (compact) return;
    const params = new URLSearchParams(window.location.search);
    const frame = window.requestAnimationFrame(() => {
      const date = params.get("date");
      const requestedMonth = params.get("month");
      const requestedStatus = params.get("status");
      if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        setSelectedDate(date);
        setMonth(date.slice(0, 7));
      } else if (requestedMonth && /^\d{4}-\d{2}$/.test(requestedMonth)) {
        setMonth(requestedMonth);
        setSelectedDate(`${requestedMonth}-01`);
      }
      setQuery(params.get("q") || "");
      setCountry(params.get("country") || "all");
      setType(params.get("type") || "all");
      if (requestedStatus === "upcoming" || requestedStatus === "ongoing" || requestedStatus === "past") {
        setStatus(requestedStatus);
      }
      setUrlReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [compact]);

  useEffect(() => {
    if (compact || !urlReady) return;
    const params = new URLSearchParams(window.location.search);
    params.set("month", month);
    params.set("date", selectedDate);
    if (query) params.set("q", query); else params.delete("q");
    if (status !== "all") params.set("status", status); else params.delete("status");
    if (type !== "all") params.set("type", type); else params.delete("type");
    if (country !== "all") params.set("country", country); else params.delete("country");
    const search = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`);
  }, [compact, country, month, query, selectedDate, status, type, urlReady]);

  return (
    <div className={compact ? "event-calendar event-calendar--compact" : "event-calendar"}>
      {!compact ? <div className="calendar-filters card">
        <label className="calendar-search"><Icon name="search" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={locale === "ar" ? "ابحث عن فعالية..." : "Search events..."} /></label>
        <select value={country} onChange={(e) => setCountry(e.target.value)}><option value="all">{locale === "ar" ? "كل الدول" : "All countries"}</option>{countries.map((item) => <option value={item} key={item}>{item}</option>)}</select>
        <select value={type} onChange={(e) => setType(e.target.value)}><option value="all">{locale === "ar" ? "كل الأنواع" : "All types"}</option>{typeOptions.map((item) => <option value={item.key} key={item.key}>{item.label}</option>)}</select>
        <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}><option value="all">{locale === "ar" ? "كل التواريخ" : "All dates"}</option><option value="upcoming">{locale === "ar" ? "قادمة" : "Upcoming"}</option><option value="ongoing">{locale === "ar" ? "جارية" : "Ongoing"}</option><option value="past">{locale === "ar" ? "سابقة" : "Past"}</option></select>
        {hasFilters ? <button className="button button-dark button-small" onClick={reset} type="button">{locale === "ar" ? "إعادة الضبط" : "Reset"}</button> : null}
      </div> : null}
      <div className="calendar-layout">
        <section className="calendar-panel card">
          <div className="calendar-header"><button className="icon-button" onClick={() => moveMonth(-1)} aria-label={locale === "ar" ? "الشهر السابق" : "Previous month"}><Icon name="chevron" /></button><h2>{monthLabel(monthDate, locale)}</h2><button className="icon-button calendar-next" onClick={() => moveMonth(1)} aria-label={locale === "ar" ? "الشهر التالي" : "Next month"}><Icon name="chevron" /></button></div>
          <div className="calendar-weekdays">{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
          <div className="calendar-grid">{cells.map((day, index) => {
            if (!day) return <span className="calendar-blank" key={`blank-${index}`} />;
            const key = `${month}-${String(day).padStart(2, "0")}`; const dayEvents = eventsByDay.get(key) || []; const selected = selectedDate === key; const today = key === now.toISOString().slice(0, 10);
            return <button className={`calendar-day ${selected ? "selected" : ""} ${today ? "today" : ""} ${dayEvents.length ? "has-events" : ""}`} key={key} onClick={() => setSelectedDate(key)} type="button" aria-label={`${dayLabel(key, locale)}${dayEvents.length ? `, ${dayEvents.length}` : ""}`}><span>{day}</span>{dayEvents.length ? <span className="calendar-dots">{dayEvents.slice(0, 3).map((event) => <i key={event.slug} style={{ backgroundColor: typeColors.get(eventTypeKey(event, locale)) } as CSSProperties} />)}{dayEvents.length > 3 ? <b>+{dayEvents.length - 3}</b> : null}</span> : null}</button>;
          })}</div>
          <div className="calendar-legend">{typeOptions.filter((item) => item.showInLegend).slice(0, compact ? 4 : 8).map((item) => <span key={item.key}><i style={{ backgroundColor: item.color } as CSSProperties} />{item.label}</span>)}</div>
        </section>
        <aside className="day-events-panel card"><div className="day-events-heading"><div><span>{locale === "ar" ? "فعاليات اليوم المحدد" : "Selected day"}</span><h3>{dayLabel(selectedDate, locale)}</h3></div><strong>{selectedEvents.length}</strong></div>
          <div className="day-events-list">{selectedEvents.length ? selectedEvents.slice(0, compact ? 2 : 8).map((event) => <Link className="calendar-event-card" href={`/${locale}/events/${event.slug}`} key={event.slug}><div className="calendar-event-image"><Image src={event.image.url} alt={localize(event.image.alt, locale)} fill sizes="110px" /></div><div><span className="event-type-dot" style={{ "--event-color": typeColors.get(eventTypeKey(event, locale)) } as CSSProperties}>{localize(event.type, locale)}</span><h4>{localize(event.title, locale)}</h4><p><Icon name="clock" />{formatDateRange(event.startDate, event.endDate, locale)}</p><p><Icon name="location" />{localize(event.city, locale)}, {localize(event.country, locale)}</p><small>{attendanceLabel(event.attendance, locale)}</small></div></Link>) : <div className="calendar-empty"><Icon name="calendar" /><p>{locale === "ar" ? "لا توجد فعاليات في هذا اليوم. اختر يومًا يحمل نقطة ملوّنة." : "No events on this day. Select a day with a colored marker."}</p></div>}</div>
          {compact ? <Link className="arrow-link" href={`/${locale}/events`}><span>{locale === "ar" ? "عرض الروزنامة كاملة" : "View full calendar"}</span><Icon name="arrow" /></Link> : null}
        </aside>
      </div>
    </div>
  );
}
