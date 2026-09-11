// Every tile the grid can show. IDs are stable strings because preferences
// store them (D31). Each has a default palette colour the student can
// change (D36). Links are one tile (D35), not one tile per link.

import type { Span } from "../grid/pack";
import type { Preferences } from "../preferences/schema";
import type { IconName } from "../ui/Icon";
import { isPaletteKey, palette, type PaletteKey } from "../ui/theme";

export type TileId =
  "hours" | "food" | "laundry" | "branvan" | "events" | "sky" | "links" | "map";

export type TileDef = {
  id: TileId;
  title: string;
  span: Span;
  icon: IconName;
  paletteKey: PaletteKey;
};

export const TILES: readonly TileDef[] = [
  {
    id: "hours",
    title: "Hours",
    span: { w: 2, h: 1 },
    icon: "clock",
    paletteKey: "amber",
  },
  {
    id: "food",
    title: "Food",
    span: { w: 2, h: 1 },
    icon: "coffee",
    paletteKey: "clay",
  },
  {
    id: "laundry",
    title: "Laundry",
    span: { w: 1, h: 1 },
    icon: "droplet",
    paletteKey: "ocean",
  },
  {
    id: "branvan",
    title: "BranVan",
    span: { w: 1, h: 1 },
    icon: "truck",
    paletteKey: "plum",
  },
  {
    id: "events",
    title: "Events",
    span: { w: 2, h: 1 },
    icon: "calendar",
    paletteKey: "moss",
  },
  {
    id: "sky",
    title: "Sky",
    span: { w: 2, h: 2 },
    icon: "moon",
    paletteKey: "ink",
  },
  {
    id: "map",
    title: "Map",
    span: { w: 1, h: 1 },
    icon: "map",
    paletteKey: "teal",
  },
  {
    id: "links",
    title: "Links",
    span: { w: 2, h: 1 },
    icon: "link",
    paletteKey: "slate",
  },
];

export const TILE_BY_ID: ReadonlyMap<string, TileDef> = new Map(
  TILES.map((t) => [t.id, t]),
);

export function isTileId(id: string | undefined): id is TileId {
  return id !== undefined && TILE_BY_ID.has(id);
}

/** The tile's colour: the student's choice if any, else its default. */
export function tileColor(
  prefs: Pick<Preferences, "colors">,
  def: TileDef,
): string {
  const chosen = prefs.colors[def.id];
  return palette[isPaletteKey(chosen) ? chosen : def.paletteKey].color;
}
