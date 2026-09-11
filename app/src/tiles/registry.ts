// Every tile the grid can show (PLAN.md D31: IDs are stable strings and are
// what preferences store). Phase 1 ships plain coloured squares; each entry
// grows content in Phase 4.

import type { Span } from "../grid/pack";

export type TileId =
  "hours" | "food" | "laundry" | "branvan" | "events" | "sky";

export type TileDef = {
  id: TileId;
  title: string;
  span: Span;
  color: string;
};

export const TILES: readonly TileDef[] = [
  { id: "hours", title: "Hours", span: { w: 2, h: 1 }, color: "#F4B740" },
  { id: "food", title: "Food", span: { w: 2, h: 1 }, color: "#E8613C" },
  { id: "laundry", title: "Laundry", span: { w: 1, h: 1 }, color: "#3E8ED0" },
  { id: "branvan", title: "BranVan", span: { w: 1, h: 1 }, color: "#5A67D8" },
  { id: "events", title: "Events", span: { w: 2, h: 1 }, color: "#38A169" },
  { id: "sky", title: "Sky", span: { w: 2, h: 2 }, color: "#2D3A6B" },
];

export const TILE_BY_ID: ReadonlyMap<string, TileDef> = new Map(
  TILES.map((t) => [t.id, t]),
);

export function isTileId(id: string | undefined): id is TileId {
  return id !== undefined && TILE_BY_ID.has(id);
}
