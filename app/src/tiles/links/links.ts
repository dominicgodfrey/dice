// The Links tile (PLAN.md D35): which links show, and how to lay their
// icons out so they fill the tile whatever their number. Pure; tested.

import type { Preferences } from "../../preferences/schema";
import { ENTRY_BY_ID, type SearchEntry } from "../../search/entries";

/** What a new student sees before choosing. */
export const DEFAULT_LINKS = ["moodle", "workday", "campusgroups", "grubhub"];

/** An empty preference means the default set, not nothing. */
export function linkEntries(
  prefs: Pick<Preferences, "promoted">,
): SearchEntry[] {
  const ids = prefs.promoted.length ? prefs.promoted : DEFAULT_LINKS;
  return ids
    .map((id) => ENTRY_BY_ID.get(id))
    .filter((e): e is SearchEntry => Boolean(e && e.action.kind === "url"));
}

export function toggleLink(
  prefs: Pick<Preferences, "promoted">,
  id: string,
): Pick<Preferences, "promoted"> {
  const cur = prefs.promoted.length ? prefs.promoted : DEFAULT_LINKS;
  return {
    promoted: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
  };
}

export type IconGrid = { cols: number; rows: number; cell: number };

/**
 * The column count that gives `n` square cells the most room inside a
 * width×height box with `gap` between them.
 */
export function iconGrid(
  n: number,
  width: number,
  height: number,
  gap = 8,
): IconGrid {
  if (n <= 0) return { cols: 1, rows: 1, cell: Math.min(width, height) };
  let best: IconGrid = { cols: 1, rows: n, cell: 0 };
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const cell = Math.min(
      (width - gap * (cols - 1)) / cols,
      (height - gap * (rows - 1)) / rows,
    );
    if (cell > best.cell) best = { cols, rows, cell };
  }
  return best;
}
