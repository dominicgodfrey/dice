// Open/closed logic for venues (PLAN.md D16). Pure; tested.

import type { Preferences } from "../../preferences/schema";
import type { HoursRange, Venue } from "../../sources/types";
import {
  atClock,
  dayKey,
  formatClock,
  localDateKey,
  sameDay,
  shortWeekday,
  startOfDay,
} from "../../util/time";

/** Both dining halls, Starbucks, Dunkin, the library (D16). */
export const DEFAULT_FOLLOWED = [
  "sherman",
  "usdan",
  "starbucks",
  "dunkin",
  "goldfarb",
];

/** An empty preference means the default set, not nothing. */
export function followedIds(
  prefs: Pick<Preferences, "followedVenues">,
): string[] {
  return prefs.followedVenues.length ? prefs.followedVenues : DEFAULT_FOLLOWED;
}

export function toggleFollowed(
  prefs: Pick<Preferences, "followedVenues">,
  id: string,
): Pick<Preferences, "followedVenues"> {
  const cur = followedIds(prefs);
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
  return { followedVenues: next };
}

/** The hour ranges a venue keeps on a given day, exceptions first. */
export function rangesOn(venue: Venue, day: Date): HoursRange[] {
  const ex = venue.exceptions?.find((e) => e.date === localDateKey(day));
  if (ex) return ex.hours;
  return venue.hours[dayKey(day)] ?? [];
}

export type Interval = { start: Date; end: Date };

/**
 * Concrete open intervals from yesterday through `daysAhead` days out, so a
 * range that runs past midnight is still found at 12:30 AM.
 */
export function intervalsAround(
  venue: Venue,
  now: Date,
  daysAhead = 7,
): Interval[] {
  const out: Interval[] = [];
  for (let i = -1; i <= daysAhead; i++) {
    const day = startOfDay(now, i);
    for (const [open, close] of rangesOn(venue, day)) {
      const start = atClock(day, open);
      let end = atClock(day, close);
      if (end <= start) end = new Date(end.getTime() + 24 * 3600 * 1000);
      out.push({ start, end });
    }
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export type Status =
  { open: true; until: Date } | { open: false; until: Date | null };

export function statusAt(venue: Venue, now: Date): Status {
  const intervals = intervalsAround(venue, now);
  const current = intervals.find((i) => i.start <= now && now < i.end);
  if (current) return { open: true, until: current.end };
  const next = intervals.find((i) => i.start > now);
  return { open: false, until: next?.start ?? null };
}

/** "Closes 8:00 PM", "Opens 7:30 AM", "Opens Mon 9:00 AM", or "Closed". */
export function statusLabel(status: Status, now: Date): string {
  if (status.open) return `Closes ${formatClock(status.until)}`;
  if (!status.until) return "Closed";
  const when = sameDay(status.until, now)
    ? formatClock(status.until)
    : `${shortWeekday(status.until)} ${formatClock(status.until)}`;
  return `Opens ${when}`;
}

/** Sort key: open first, then whichever changes soonest. */
export function statusSortKey(status: Status): number {
  const t = status.until?.getTime() ?? Number.MAX_SAFE_INTEGER;
  return (status.open ? 0 : 1e15) + t;
}
