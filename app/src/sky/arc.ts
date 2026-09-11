// The header's time-of-day line: sunrise to sunset while the sun is up,
// moonrise to moonset once it is down, and where now sits along it. Pure;
// tested. Uses the campus coordinate like the rest of the sky (D17).

import * as Astronomy from "astronomy-engine";
import { CAMPUS } from "./sun";

const observer = new Astronomy.Observer(CAMPUS.lat, CAMPUS.lon, CAMPUS.height);
const DAY_MS = 24 * 3600 * 1000;

export type DayArc = {
  /** What travels the arc. "none" is a night with no moon up. */
  body: "sun" | "moon" | "none";
  start: Date;
  end: Date;
  /** 0 at start, 1 at end, clamped. */
  t: number;
  startLabel: string;
  endLabel: string;
};

function search(
  body: Astronomy.Body,
  direction: 1 | -1,
  from: Date,
  days: number,
): Date | null {
  return (
    Astronomy.SearchRiseSet(body, observer, direction, from, days)?.date ?? null
  );
}

/** The last rise of `body` at or before `now`, looking back `back` ms. */
function lastRise(body: Astronomy.Body, now: Date, back: number): Date | null {
  let rise = search(body, +1, new Date(now.getTime() - back), 3);
  if (!rise || rise > now) return null;
  for (;;) {
    const next = search(body, +1, new Date(rise.getTime() + 60_000), 3);
    if (!next || next > now) return rise;
    rise = next;
  }
}

function fraction(start: Date, end: Date, now: Date): number {
  const t =
    (now.getTime() - start.getTime()) / (end.getTime() - start.getTime());
  return Math.max(0, Math.min(1, t));
}

export function arcAt(now: Date): DayArc | null {
  const sunrise = lastRise(Astronomy.Body.Sun, now, DAY_MS + 3600_000);
  if (!sunrise) return null;
  const sunset = search(Astronomy.Body.Sun, -1, sunrise, 2);
  if (!sunset) return null;
  if (now < sunset) {
    return {
      body: "sun",
      start: sunrise,
      end: sunset,
      t: fraction(sunrise, sunset, now),
      startLabel: "Sunrise",
      endLabel: "Sunset",
    };
  }
  const moonrise = lastRise(Astronomy.Body.Moon, now, DAY_MS + 2 * 3600_000);
  const moonset = moonrise
    ? search(Astronomy.Body.Moon, -1, moonrise, 2)
    : null;
  if (moonrise && moonset && now < moonset) {
    return {
      body: "moon",
      start: moonrise,
      end: moonset,
      t: fraction(moonrise, moonset, now),
      startLabel: "Moonrise",
      endLabel: "Moonset",
    };
  }
  const nextSunrise = search(Astronomy.Body.Sun, +1, sunset, 2);
  if (!nextSunrise) return null;
  return {
    body: "none",
    start: sunset,
    end: nextSunrise,
    t: fraction(sunset, nextSunrise, now),
    startLabel: "Sunset",
    endLabel: "Sunrise",
  };
}

/** A point along a quadratic curve from p0 through control c to p2. */
export function bezierPoint(
  p0: [number, number],
  c: [number, number],
  p2: [number, number],
  t: number,
): [number, number] {
  const u = 1 - t;
  return [
    u * u * p0[0] + 2 * u * t * c[0] + t * t * p2[0],
    u * u * p0[1] + 2 * u * t * c[1] + t * t * p2[1],
  ];
}
