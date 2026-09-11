// BranVan arrivals and geometry (PLAN.md D18). Pure; tested.

import type {
  ShuttleData,
  ShuttleStop,
  ShuttleVehicle,
} from "../../sources/types";

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

/** The first route that serves a stop, or null. */
export function routeServing(data: ShuttleData, stopId: string): string | null {
  return data.routes.find((r) => r.stops.includes(stopId))?.id ?? null;
}

type XY = { x: number; y: number };

/** Local flat coordinates in metres-ish, north up. */
function flat(lat: number, lon: number, lat0: number): XY {
  const k = Math.cos(lat0 * (Math.PI / 180));
  return { x: lon * k * 111_000, y: lat * 111_000 };
}

/**
 * Where along a route each stop sits, as a fraction 0..1 of the route's
 * length, and where each vehicle projects onto it. Vehicles more than
 * `maxOffMetres` from the line are left out.
 */
export function alongRoute(
  stops: readonly ShuttleStop[],
  vehicles: readonly ShuttleVehicle[],
  maxOffMetres = 400,
): { stops: number[]; vehicles: { id: string; t: number }[] } {
  if (stops.length < 2) return { stops: stops.map(() => 0), vehicles: [] };
  const lat0 = stops[0].lat;
  const pts = stops.map((s) => flat(s.lat, s.lon, lat0));
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(
      cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y),
    );
  }
  const total = cum[cum.length - 1] || 1;
  const out: { id: string; t: number }[] = [];
  for (const v of vehicles) {
    const p = flat(v.lat, v.lon, lat0);
    let best = { d: Infinity, t: 0 };
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len2 = dx * dx + dy * dy || 1;
      const u = Math.max(
        0,
        Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2),
      );
      const qx = a.x + u * dx;
      const qy = a.y + u * dy;
      const d = Math.hypot(p.x - qx, p.y - qy);
      if (d < best.d)
        best = { d, t: (cum[i - 1] + u * (cum[i] - cum[i - 1])) / total };
    }
    if (best.d <= maxOffMetres) out.push({ id: v.id, t: best.t });
  }
  return { stops: cum.map((c) => c / total), vehicles: out };
}

/** Map stops into a box, preserving aspect ratio, with padding in units. */
export function project(
  stops: readonly ShuttleStop[],
  width: number,
  height: number,
  pad = 24,
): { at: (lat: number, lon: number) => XY; points: Map<string, XY> } {
  const points = new Map<string, XY>();
  if (stops.length === 0) return { at: () => ({ x: 0, y: 0 }), points };
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
  const at = (lat: number, lon: number): XY => ({
    x: offX + (lon - minLon) * cos * scale,
    y: offY + (maxLat - lat) * scale,
  });
  for (const s of stops) points.set(s.id, at(s.lat, s.lon));
  return { at, points };
}
