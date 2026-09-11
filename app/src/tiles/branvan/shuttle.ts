// BranVan arrivals (PLAN.md D18). Pure; tested.

import type { ShuttleData, ShuttleStop } from "../../sources/types";

export type NextArrival = {
  routeId: string;
  routeName: string;
  color: string;
  minutes: number;
};

/** Every upcoming arrival at a stop, soonest first. */
export function arrivalsAt(data: ShuttleData, stopId: string): NextArrival[] {
  const out: NextArrival[] = [];
  for (const a of data.arrivals) {
    if (a.stopId !== stopId) continue;
    const route = data.routes.find((r) => r.id === a.routeId);
    if (!route) continue;
    for (const minutes of a.minutes) {
      out.push({
        routeId: route.id,
        routeName: route.name,
        color: route.color,
        minutes,
      });
    }
  }
  return out.sort((a, b) => a.minutes - b.minutes);
}

export function minutesLabel(m: number): string {
  if (m <= 0) return "Now";
  if (m === 1) return "1 min";
  return `${m} min`;
}

/** Stops in the order a route visits them. */
export function stopsOnRoute(
  data: ShuttleData,
  routeId: string,
): ShuttleStop[] {
  const route = data.routes.find((r) => r.id === routeId);
  if (!route) return [];
  const byId = new Map(data.stops.map((s) => [s.id, s]));
  return route.stops
    .map((id) => byId.get(id))
    .filter((s): s is ShuttleStop => Boolean(s));
}

/** Map stops into a box, preserving aspect ratio, with padding in units. */
export function project(
  stops: readonly ShuttleStop[],
  width: number,
  height: number,
  pad = 24,
): Map<string, { x: number; y: number }> {
  const out = new Map<string, { x: number; y: number }>();
  if (stops.length === 0) return out;
  const lats = stops.map((s) => s.lat);
  const lons = stops.map((s) => s.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  // Longitude degrees are shorter than latitude degrees at this latitude.
  const cos = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180));
  const spanX = Math.max((maxLon - minLon) * cos, 1e-6);
  const spanY = Math.max(maxLat - minLat, 1e-6);
  const scale = Math.min((width - pad * 2) / spanX, (height - pad * 2) / spanY);
  const offX = (width - spanX * scale) / 2;
  const offY = (height - spanY * scale) / 2;
  for (const s of stops) {
    out.set(s.id, {
      x: offX + (s.lon - minLon) * cos * scale,
      y: offY + (maxLat - s.lat) * scale,
    });
  }
  return out;
}
