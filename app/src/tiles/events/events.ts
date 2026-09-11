// Event grouping, the calendar grids (D48) and the add-to-Google URL
// (PLAN.md Phase 4). Pure; tested.

import type { CampusEvent } from "../../sources/types";
import { formatClock, sameDay, startOfDay } from "../../util/time";

export function upcoming(
  events: readonly CampusEvent[],
  now: Date,
): CampusEvent[] {
  return events
    .filter((e) => new Date(e.end).getTime() >= now.getTime())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

export function isAllDay(e: CampusEvent): boolean {
  const s = new Date(e.start);
  const end = new Date(e.end);
  return (
    s.getHours() === 0 &&
    s.getMinutes() === 0 &&
    end.getTime() - s.getTime() >= 23 * 3600 * 1000
  );
}

/** "Today", "Tomorrow", or "Mon 14". */
export function dayLabel(d: Date, now: Date): string {
  if (sameDay(d, now)) return "Today";
  if (sameDay(d, startOfDay(now, 1))) return "Tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
}

/** An event that began on an earlier day and has not ended. */
function ongoing(e: CampusEvent, now: Date): boolean {
  return new Date(e.start).getTime() < startOfDay(now).getTime();
}

export function whenLabel(e: CampusEvent, now: Date): string {
  const s = new Date(e.start);
  if (ongoing(e, now)) {
    return isAllDay(e)
      ? "Today"
      : `Today · until ${formatClock(new Date(e.end))}`;
  }
  const day = dayLabel(s, now);
  return isAllDay(e) ? day : `${day} · ${formatClock(s)}`;
}

export type Grouped = { key: string; label: string; events: CampusEvent[] };

/** Events within the next `days` days, grouped by day in order. */
export function groupByDay(
  events: readonly CampusEvent[],
  now: Date,
  days = 7,
): Grouped[] {
  const limit = startOfDay(now, days).getTime();
  const groups = new Map<string, Grouped>();
  for (const e of upcoming(events, now)) {
    // Something that began days ago and is still on belongs to today.
    const s = ongoing(e, now) ? now : new Date(e.start);
    if (s.getTime() >= limit) continue;
    const key = startOfDay(s).toISOString();
    const g = groups.get(key) ?? { key, label: dayLabel(s, now), events: [] };
    g.events.push(e);
    groups.set(key, g);
  }
  return [...groups.values()];
}

function gcalStamp(d: Date, allDay: boolean): string {
  if (allDay) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}${m}${day}`;
  }
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/** The "Add to Google Calendar" template URL for an event. */
export function googleCalendarUrl(e: CampusEvent): string {
  const allDay = isAllDay(e);
  const start = new Date(e.start);
  let end = new Date(e.end);
  // Google treats all-day end dates as exclusive.
  if (allDay) end = startOfDay(end, 1);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${gcalStamp(start, allDay)}/${gcalStamp(end, allDay)}`,
  });
  if (e.location) params.set("location", e.location);
  if (e.url) params.set("details", e.url);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Events touching the given local day, earliest first. */
export function eventsOn(
  events: readonly CampusEvent[],
  day: Date,
): CampusEvent[] {
  const from = startOfDay(day).getTime();
  const to = startOfDay(day, 1).getTime();
  return events
    .filter((e) => {
      const s = new Date(e.start).getTime();
      const end = new Date(e.end).getTime();
      return s < to && end > from;
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/** Sunday to Saturday of the week holding the day. */
export function weekOf(d: Date): Date[] {
  const sunday = startOfDay(d, -d.getDay());
  return Array.from({ length: 7 }, (_, i) => startOfDay(sunday, i));
}

/** The weeks that cover the day's month, each Sunday to Saturday. */
export function monthGrid(d: Date): Date[][] {
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const weeks: Date[][] = [];
  let cursor = startOfDay(first, -first.getDay());
  while (cursor.getTime() <= last.getTime()) {
    weeks.push(Array.from({ length: 7 }, (_, i) => startOfDay(cursor, i)));
    cursor = startOfDay(cursor, 7);
  }
  return weeks;
}

/** The same day of the month `n` months on, clamped to that month's end. */
export function addMonths(d: Date, n: number): Date {
  const first = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const lastDay = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  first.setDate(Math.min(d.getDate(), lastDay.getDate()));
  return startOfDay(first);
}

/** "September 2026". */
export function monthLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/** "Sep 6 – 12" or "Aug 30 – Sep 5". */
export function weekLabel(d: Date): string {
  const [a, , , , , , b] = weekOf(d);
  const md = (x: Date) =>
    x.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return a.getMonth() === b.getMonth()
    ? `${md(a)} – ${b.getDate()}`
    : `${md(a)} – ${md(b)}`;
}
