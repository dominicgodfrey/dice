// Event grouping and the add-to-Google URL (PLAN.md Phase 4). Pure; tested.

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

export function whenLabel(e: CampusEvent, now: Date): string {
  const s = new Date(e.start);
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
    const s = new Date(e.start);
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
