// Small date helpers shared by tiles. Everything is device-local time.

import type { Weekday } from "../sources/types";

const WEEKDAYS: Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function dayKey(d: Date): Weekday {
  return WEEKDAYS[d.getDay()];
}

export function isWeekend(d: Date): boolean {
  const k = dayKey(d);
  return k === "sat" || k === "sun";
}

/** YYYY-MM-DD in local time. */
export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Midnight at the start of the given day, plus an offset in days. */
export function startOfDay(d: Date, offsetDays = 0): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() + offsetDays);
  return x;
}

/** "07:30" on the given day. */
export function atClock(day: Date, hm: string): Date {
  const [h, m] = hm.split(":").map(Number);
  const x = new Date(day);
  x.setHours(h, m, 0, 0);
  return x;
}

export function formatClock(d: Date): string {
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatClockRange(hm: [string, string], day: Date): string {
  return `${formatClock(atClock(day, hm[0]))} – ${formatClock(atClock(day, hm[1]))}`;
}

export function sameDay(a: Date, b: Date): boolean {
  return localDateKey(a) === localDateKey(b);
}

export function shortWeekday(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: "short" });
}
