// Pure helpers between the preferences object and what the grid shows.
// `order` lists every known tile ID; unknown IDs are dropped and tiles the
// preferences have never seen are appended, so adding a tile to the
// registry never needs a migration. Hidden tiles keep a place in `order`
// but are not rendered.

import type { Preferences } from "../preferences/schema";
import type { TileDef } from "../tiles/registry";

/** Every tile in stored order, unknown IDs dropped, new tiles appended. */
export function orderedTiles(
  prefs: Pick<Preferences, "order">,
  all: readonly TileDef[],
): TileDef[] {
  const byId = new Map<string, TileDef>(all.map((t) => [t.id, t]));
  const seen = new Set<string>();
  const out: TileDef[] = [];
  for (const id of prefs.order) {
    const t = byId.get(id);
    if (t && !seen.has(id)) {
      out.push(t);
      seen.add(id);
    }
  }
  for (const t of all) if (!seen.has(t.id)) out.push(t);
  return out;
}

/** The tiles the grid renders: ordered, minus hidden. */
export function visibleTiles(
  prefs: Pick<Preferences, "order" | "hidden">,
  all: readonly TileDef[],
): TileDef[] {
  const hidden = new Set(prefs.hidden);
  return orderedTiles(prefs, all).filter((t) => !hidden.has(t.id));
}

/** Move one element of an array to a new index. */
export function move<T>(list: readonly T[], from: number, to: number): T[] {
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * A new `order` from the visible tiles in their new order, keeping hidden
 * tiles after them. Hidden tiles' relative order is irrelevant because
 * showing one appends it.
 */
export function orderFromVisible(
  prefs: Pick<Preferences, "order" | "hidden">,
  visibleIds: readonly string[],
  all: readonly TileDef[],
): string[] {
  const hidden = new Set(prefs.hidden);
  const hiddenIds = orderedTiles(prefs, all)
    .map((t) => t.id)
    .filter((id) => hidden.has(id));
  return [...visibleIds, ...hiddenIds];
}

export function hideTile(
  prefs: Pick<Preferences, "order" | "hidden">,
  id: string,
): Pick<Preferences, "hidden"> {
  return {
    hidden: prefs.hidden.includes(id) ? prefs.hidden : [...prefs.hidden, id],
  };
}

/** Show a hidden tile at the end of the grid. */
export function showTile(
  prefs: Pick<Preferences, "order" | "hidden">,
  id: string,
  all: readonly TileDef[],
): Pick<Preferences, "order" | "hidden"> {
  const order = orderedTiles(prefs, all)
    .map((t) => t.id)
    .filter((x) => x !== id);
  return {
    order: [...order, id],
    hidden: prefs.hidden.filter((x) => x !== id),
  };
}
