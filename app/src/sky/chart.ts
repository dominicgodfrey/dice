// The sky over a place at a time, projected for the chart (PLAN.md D38).
// Azimuthal equidistant, zenith at the centre, horizon at the rim, drawn as
// seen looking up (east on the left when north is up). Pure; tested.

import * as Astronomy from "astronomy-engine";
import { bodiesAt, type Body } from "./bodies";
import { CONSTELLATIONS, STAR_BY_ID, STARS, type Star } from "./catalog";

export type Observer = { lat: number; lon: number };

export type Placed = { alt: number; az: number };

export type ChartStar = Star & Placed;

export type ChartLine = { con: string; from: ChartStar; to: ChartStar };

export type ChartConstellation = {
  abbr: string;
  name: string;
  /** Mean altitude of its visible stars. */
  alt: number;
  az: number;
  visible: number;
  total: number;
};

export type Chart = {
  stars: ChartStar[];
  lines: ChartLine[];
  constellations: ChartConstellation[];
  bodies: (Body & Placed)[];
};

const HORIZON_MARGIN = -3;

export function placeStar(star: Star, date: Date, obs: Observer): Placed {
  const o = new Astronomy.Observer(obs.lat, obs.lon, 50);
  const h = Astronomy.Horizon(date, o, star.ra, star.dec, "normal");
  return { alt: h.altitude, az: h.azimuth };
}

/** Everything above the horizon (with a small margin so lines reach the rim). */
export function chartAt(date: Date, obs: Observer): Chart {
  const o = new Astronomy.Observer(obs.lat, obs.lon, 50);
  const placed = new Map<string, ChartStar>();
  for (const s of STARS) {
    const h = Astronomy.Horizon(date, o, s.ra, s.dec, "normal");
    if (h.altitude > HORIZON_MARGIN)
      placed.set(s.id, { ...s, alt: h.altitude, az: h.azimuth });
  }
  const lines: ChartLine[] = [];
  const constellations: ChartConstellation[] = [];
  for (const c of CONSTELLATIONS) {
    for (const path of c.lines) {
      for (let i = 1; i < path.length; i++) {
        const a = placed.get(path[i - 1]);
        const b = placed.get(path[i]);
        if (a && b) lines.push({ con: c.abbr, from: a, to: b });
      }
    }
    const members = STARS.filter((s) => s.con === c.abbr);
    const up = members
      .map((s) => placed.get(s.id))
      .filter((s): s is ChartStar => s !== undefined && s.alt > 0);
    if (up.length === 0) continue;
    // Mean direction via unit vectors so azimuths near 0/360 average sanely.
    let x = 0;
    let y = 0;
    let z = 0;
    for (const s of up) {
      const a = (s.alt * Math.PI) / 180;
      const b = (s.az * Math.PI) / 180;
      x += Math.cos(a) * Math.sin(b);
      y += Math.cos(a) * Math.cos(b);
      z += Math.sin(a);
    }
    const n = up.length;
    const az = ((Math.atan2(x / n, y / n) * 180) / Math.PI + 360) % 360;
    const alt = (Math.asin(Math.min(1, z / n)) * 180) / Math.PI;
    constellations.push({
      abbr: c.abbr,
      name: c.name,
      alt,
      az,
      visible: up.length,
      total: members.length,
    });
  }
  constellations.sort((a, b) => b.alt - a.alt);
  const bodies = bodiesAt(date)
    .filter((b) => b.altitude > HORIZON_MARGIN)
    .map((b) => ({ ...b, alt: b.altitude, az: b.azimuth }));
  return { stars: [...placed.values()], lines, constellations, bodies };
}

/**
 * Chart coordinates for an altitude and azimuth: unit disc, y down, with
 * `heading` (degrees) at the top. Looking up, east is on the left.
 */
export function toDisc(
  alt: number,
  az: number,
  heading = 0,
): { x: number; y: number } {
  const r = Math.max(0, (90 - alt) / 90);
  const a = ((az - heading) * Math.PI) / 180;
  return { x: -r * Math.sin(a), y: -r * Math.cos(a) };
}

/** Constellations whose figure is mostly up, highest first. */
export function constellationsUp(
  chart: Chart,
  minFraction = 0.5,
): ChartConstellation[] {
  return chart.constellations.filter(
    (c) => c.visible / c.total >= minFraction && c.alt > 10,
  );
}

/** A star's dot radius from its magnitude. */
export function starRadius(mag: number, scale = 1): number {
  return Math.max(0.6, 3.2 - mag * 0.7) * scale;
}

export { STAR_BY_ID };
