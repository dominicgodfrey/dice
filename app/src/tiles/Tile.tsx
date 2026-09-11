// One tile component, two layouts chosen by `expanded` (PLAN.md D9), each
// tile's content dispatched by ID.

import type { ComponentType } from "react";
import type { Shape } from "../grid/layout";
import { BranVanCollapsed, BranVanExpanded } from "./branvan/BranVanTile";
import { EventsCollapsed, EventsExpanded } from "./events/EventsTile";
import { FoodCollapsed, FoodExpanded } from "./food/FoodTile";
import { HoursCollapsed, HoursExpanded } from "./hours/HoursTile";
import { LaundryCollapsed, LaundryExpanded } from "./laundry/LaundryTile";
import { LinksCollapsed, LinksExpanded } from "./links/LinksTile";
import { MapCollapsed, MapExpanded } from "./map/MapTile";
import type { TileDef, TileId } from "./registry";
import { SkyCollapsed, SkyExpanded } from "./sky/SkyTile";

type Content = {
  Collapsed: ComponentType<{ shape?: Shape }>;
  Expanded: ComponentType;
};

const CONTENT: Record<TileId, Content> = {
  hours: { Collapsed: HoursCollapsed, Expanded: HoursExpanded },
  food: { Collapsed: FoodCollapsed, Expanded: FoodExpanded },
  laundry: { Collapsed: LaundryCollapsed, Expanded: LaundryExpanded },
  branvan: { Collapsed: BranVanCollapsed, Expanded: BranVanExpanded },
  events: { Collapsed: EventsCollapsed, Expanded: EventsExpanded },
  sky: { Collapsed: SkyCollapsed, Expanded: SkyExpanded },
  links: { Collapsed: LinksCollapsed, Expanded: LinksExpanded },
  map: { Collapsed: MapCollapsed, Expanded: MapExpanded },
};

export function Tile({
  def,
  expanded,
  shape,
}: {
  def: TileDef;
  expanded: boolean;
  /** Only a fill tile that came out non-rectangular has one (D46). */
  shape?: Shape;
}) {
  const content = CONTENT[def.id];
  return expanded ? <content.Expanded /> : <content.Collapsed shape={shape} />;
}
