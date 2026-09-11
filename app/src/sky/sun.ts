// Layer 1 of the Sky tile (PLAN.md D17): sun altitude, sunrise and sunset
// from the fixed campus coordinate, computed on device, no permission.
// Also the colour of the ambient header band.

import * as Astronomy from "astronomy-engine";

/** Brandeis, Waltham MA. Never asks for the student's location. */
export const CAMPUS = { lat: 42.3656, lon: -71.2597, height: 50 };

const observer = new Astronomy.Observer(CAMPUS.lat, CAMPUS.lon, CAMPUS.height);

/** Degrees above the horizon; negative below. */
export function sunAltitude(date: Date): number {
  const eq = Astronomy.Equator(Astronomy.Body.Sun, date, observer, true, true);
  return Astronomy.Horizon(date, observer, eq.ra, eq.dec, "normal").altitude;
}

/** Today's sunrise and sunset in the device's local day. */
export function sunTimes(date: Date): {
  sunrise: Date | null;
  sunset: Date | null;
} {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const rise = Astronomy.SearchRiseSet(
    Astronomy.Body.Sun,
    observer,
    +1,
    start,
    1,
  );
  const set = Astronomy.SearchRiseSet(
    Astronomy.Body.Sun,
    observer,
    -1,
    start,
    1,
  );
  return { sunrise: rise?.date ?? null, sunset: set?.date ?? null };
}

export type Sky = { top: string; bottom: string; dark: boolean; label: string };

// Altitude stops, lowest first. Between stops the colours blend linearly.
const STOPS: { alt: number; top: string; bottom: string; label: string }[] = [
  { alt: -90, top: "#070B1E", bottom: "#141B3D", label: "Night" },
  { alt: -18, top: "#0B1230", bottom: "#1B2145", label: "Night" },
  { alt: -12, top: "#1B2145", bottom: "#3E3B75", label: "Twilight" },
  { alt: -6, top: "#3B3F7A", bottom: "#C9698A", label: "Twilight" },
  { alt: 0, top: "#6A7DBF", bottom: "#FFAE6B", label: "Golden hour" },
  { alt: 8, top: "#6FAEE8", bottom: "#FFD9A6", label: "Golden hour" },
  { alt: 20, top: "#4F9DE8", bottom: "#BFE0FF", label: "Day" },
  { alt: 90, top: "#3D8FE0", bottom: "#CFE7FF", label: "Day" },
];

export function lerpHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift: number) => {
    const x = (pa >> shift) & 255;
    const y = (pb >> shift) & 255;
    return Math.round(x + (y - x) * t);
  };
  const v = (ch(16) << 16) | (ch(8) << 8) | ch(0);
  return "#" + v.toString(16).padStart(6, "0").toUpperCase();
}

export function skyFor(altitude: number): Sky {
  const alt = Math.max(-90, Math.min(90, altitude));
  let i = 0;
  while (i < STOPS.length - 2 && alt >= STOPS[i + 1].alt) i++;
  const a = STOPS[i];
  const b = STOPS[i + 1];
  const t = (alt - a.alt) / (b.alt - a.alt);
  return {
    top: lerpHex(a.top, b.top, t),
    bottom: lerpHex(a.bottom, b.bottom, t),
    dark: alt < 4,
    label: t < 0.5 ? a.label : b.label,
  };
}
