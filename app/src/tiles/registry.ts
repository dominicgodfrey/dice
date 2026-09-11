// Every tile the grid can show. Live tiles are fixed and have routes
// (PLAN.md D29); link tiles are search entries the student promoted (D12),
// open their URL on tap, and never expand. IDs are stable strings because
// preferences store them (D31).

import type { Preferences } from "../preferences/schema";
import { ENTRY_BY_ID, type SearchEntry } from "../search/entries";
import type { Span } from "../grid/pack";

export type TileId =
  "hours" | "food" | "laundry" | "branvan" | "events" | "sky";

type Base = { title: string; span: Span; color: string };

export type LiveTileDef = Base & { kind: "live"; id: TileId };

export type LinkTileDef = Base & {
  kind: "link";
  id: string;
  entryId: string;
  url: string;
  icon: string;
};

export type TileDef = LiveTileDef | LinkTileDef;

export const LIVE_TILES: readonly LiveTileDef[] = [
  {
    kind: "live",
    id: "hours",
    title: "Hours",
    span: { w: 2, h: 1 },
    color: "#F4B740",
  },
  {
    kind: "live",
    id: "food",
    title: "Food",
    span: { w: 2, h: 1 },
    color: "#E8613C",
  },
  {
    kind: "live",
    id: "laundry",
    title: "Laundry",
    span: { w: 1, h: 1 },
    color: "#3E8ED0",
  },
  {
    kind: "live",
    id: "branvan",
    title: "BranVan",
    span: { w: 1, h: 1 },
    color: "#5A67D8",
  },
  {
    kind: "live",
    id: "events",
    title: "Events",
    span: { w: 2, h: 1 },
    color: "#38A169",
  },
  {
    kind: "live",
    id: "sky",
    title: "Sky",
    span: { w: 2, h: 2 },
    color: "#2D3A6B",
  },
];

export const TILE_BY_ID: ReadonlyMap<string, LiveTileDef> = new Map(
  LIVE_TILES.map((t) => [t.id, t]),
);

export function isTileId(id: string | undefined): id is TileId {
  return id !== undefined && TILE_BY_ID.has(id);
}

export const LINK_PREFIX = "link:";

export function linkTileId(entryId: string): string {
  return LINK_PREFIX + entryId;
}

export function linkTile(entry: SearchEntry): LinkTileDef | null {
  if (entry.action.kind !== "url") return null;
  return {
    kind: "link",
    id: linkTileId(entry.id),
    entryId: entry.id,
    title: entry.title,
    span: { w: 1, h: 1 },
    color: entry.color ?? "#6B7280",
    url: entry.action.url.replace("{query}", ""),
    icon: entry.icon,
  };
}

/** Live tiles plus one link tile per promoted entry. */
export function allTiles(prefs: Pick<Preferences, "promoted">): TileDef[] {
  const links: TileDef[] = [];
  for (const id of prefs.promoted) {
    const entry = ENTRY_BY_ID.get(id);
    const tile = entry ? linkTile(entry) : null;
    if (tile) links.push(tile);
  }
  return [...LIVE_TILES, ...links];
}
