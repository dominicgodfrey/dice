// Layer 2 of the Sky tile (PLAN.md D17): the moon and the naked-eye planets
// from the campus coordinate. Pure; tested.

import * as Astronomy from "astronomy-engine";
import { CAMPUS } from "./sun";

const observer = new Astronomy.Observer(CAMPUS.lat, CAMPUS.lon, CAMPUS.height);

export type Body = {
  id: string;
  name: string;
  /** Degrees above the horizon; negative is below. */
  altitude: number;
  /** Degrees clockwise from north. */
  azimuth: number;
  /** Rough visual brightness, lower is brighter (magnitude). */
  magnitude: number;
};

const PLANETS: { id: string; name: string; body: Astronomy.Body }[] = [
  { id: "mercury", name: "Mercury", body: Astronomy.Body.Mercury },
  { id: "venus", name: "Venus", body: Astronomy.Body.Venus },
  { id: "mars", name: "Mars", body: Astronomy.Body.Mars },
  { id: "jupiter", name: "Jupiter", body: Astronomy.Body.Jupiter },
  { id: "saturn", name: "Saturn", body: Astronomy.Body.Saturn },
];

function place(
  id: string,
  name: string,
  body: Astronomy.Body,
  date: Date,
): Body {
  const eq = Astronomy.Equator(body, date, observer, true, true);
  const hor = Astronomy.Horizon(date, observer, eq.ra, eq.dec, "normal");
  let magnitude = 0;
  try {
    magnitude = Astronomy.Illumination(body, date).mag;
  } catch {
    magnitude = 0;
  }
  return { id, name, altitude: hor.altitude, azimuth: hor.azimuth, magnitude };
}

/** Sun, moon and planets, wherever they are, brightest first. */
export function bodiesAt(date: Date): Body[] {
  const list = [
    place("sun", "Sun", Astronomy.Body.Sun, date),
    place("moon", "Moon", Astronomy.Body.Moon, date),
    ...PLANETS.map((p) => place(p.id, p.name, p.body, date)),
  ];
  return list.sort((a, b) => a.magnitude - b.magnitude);
}

export function aboveHorizon(bodies: readonly Body[]): Body[] {
  return bodies.filter((b) => b.altitude > 0);
}

export type MoonPhase = { fraction: number; name: string; waxing: boolean };

export function moonPhase(date: Date): MoonPhase {
  const phase = Astronomy.MoonPhase(date); // 0..360, 0 = new, 180 = full
  const fraction = Astronomy.Illumination(
    Astronomy.Body.Moon,
    date,
  ).phase_fraction;
  const waxing = phase < 180;
  let name: string;
  if (phase < 22.5 || phase >= 337.5) name = "New moon";
  else if (phase < 67.5) name = "Waxing crescent";
  else if (phase < 112.5) name = "First quarter";
  else if (phase < 157.5) name = "Waxing gibbous";
  else if (phase < 202.5) name = "Full moon";
  else if (phase < 247.5) name = "Waning gibbous";
  else if (phase < 292.5) name = "Last quarter";
  else name = "Waning crescent";
  return { fraction, name, waxing };
}

/** Compass point for an azimuth: "NE", "SSW". */
export function compassPoint(azimuth: number): string {
  const points = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  return points[Math.round((((azimuth % 360) + 360) % 360) / 22.5) % 16];
}
