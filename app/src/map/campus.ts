// Campus map data and geometry (PLAN.md D39). Pure; tested.

import type { CampusData, Building } from "../sources/types";

export type XY = { x: number; y: number };

/** Metres east and north of the campus origin. */
export function toLocal(data: CampusData, lat: number, lon: number): XY {
  const k = Math.cos((data.origin.lat * Math.PI) / 180);
  return {
    x: (lon - data.origin.lon) * k * 111_000,
    y: (lat - data.origin.lat) * 111_000,
  };
}

/** The bounds of everything on the map, in local metres, with padding. */
export function bounds(
  data: CampusData,
  pad = 60,
): { minX: number; maxX: number; minY: number; maxY: number } {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  const take = (p: XY, r = 0) => {
    minX = Math.min(minX, p.x - r);
    maxX = Math.max(maxX, p.x + r);
    minY = Math.min(minY, p.y - r);
    maxY = Math.max(maxY, p.y + r);
  };
  for (const b of data.buildings)
    take(toLocal(data, b.lat, b.lon), Math.max(b.w, b.h) / 2);
  for (const p of data.places) take(toLocal(data, p.lat, p.lon));
  if (!isFinite(minX)) return { minX: -100, maxX: 100, minY: -100, maxY: 100 };
  return {
    minX: minX - pad,
    maxX: maxX + pad,
    minY: minY - pad,
    maxY: maxY + pad,
  };
}

/**
 * A viewport that maps local metres to pixels, north up: fit the bounds in
 * a width×height box and return the metres-per-pixel scale and a projector.
 */
export function fit(data: CampusData, width: number, height: number) {
  const b = bounds(data);
  const spanX = b.maxX - b.minX;
  const spanY = b.maxY - b.minY;
  const pxPerM = Math.min(width / spanX, height / spanY);
  const offX = (width - spanX * pxPerM) / 2;
  const offY = (height - spanY * pxPerM) / 2;
  const project = (lat: number, lon: number): XY => {
    const l = toLocal(data, lat, lon);
    return {
      x: offX + (l.x - b.minX) * pxPerM,
      y: offY + (b.maxY - l.y) * pxPerM,
    };
  };
  return { pxPerM, project, spanX, spanY };
}

/** Which details a zoom factor reveals (D39). */
export function detailLevel(zoom: number): 1 | 2 | 3 {
  if (zoom >= 3) return 3;
  if (zoom >= 1.7) return 2;
  return 1;
}

export const KIND_LABELS: Record<Building["kind"], string> = {
  academic: "Academic",
  residence: "Residence",
  dining: "Dining",
  library: "Library",
  athletics: "Athletics",
  student: "Student life",
  arts: "Arts",
  admin: "Offices",
  other: "Other",
};
