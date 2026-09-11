// The Links tile (PLAN.md D35, D46): which links show, and how to lay their
// icons out so they fill the tile whatever its shape. Pure; tested.

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

export type Box = { w: number; h: number };

export type IconLayout = {
  /** Side of every icon cell; the same in every box. */
  size: number;
  /** How many icons each box takes, in order, summing to n. */
  counts: number[];
};

function capacity(b: Box, size: number, gap: number): number {
  const across = Math.floor((b.w + gap) / (size + gap));
  const down = Math.floor((b.h + gap) / (size + gap));
  return Math.max(0, across) * Math.max(0, down);
}

/**
 * The largest square cell that lets `n` icons fit across the given boxes
 * (the tile's unit cells, minus their padding), with `gap` between cells,
 * and how many land in each box, filled in order.
 */
export function layoutIcons(n: number, boxes: Box[], gap = 8): IconLayout {
  const usable = boxes.filter((b) => b.w > 0 && b.h > 0);
  if (n <= 0 || usable.length === 0) {
    return { size: 0, counts: boxes.map(() => 0) };
  }
  const max = Math.max(...usable.map((b) => Math.min(b.w, b.h)));
  let size = 0;
  for (let s = Math.floor(max); s >= 8; s--) {
    const total = boxes.reduce((sum, b) => sum + capacity(b, s, gap), 0);
    if (total >= n) {
      size = s;
      break;
    }
  }
  if (size === 0) size = 8;
  let left = n;
  const counts = boxes.map((b) => {
    const take = Math.min(left, capacity(b, size, gap));
    left -= take;
    return take;
  });
  return { size, counts };
}
