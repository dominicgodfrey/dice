// Campus map geometry (PLAN.md D39, D41): aerial imagery of campus in Web
// Mercator, with the fixture's buildings, places and photos placed on it.
// Pure; tested.

import type { Building, CampusData } from "../sources/types";
import imagery from "./imagery.json";

export type XY = { x: number; y: number };

export type Imagery = {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
  width: number;
  height: number;
  attribution: string;
};

export const IMAGERY: Imagery = imagery;

const R = 6378137;

/** WGS84 to Web Mercator metres (EPSG:3857). */
export function mercator(lat: number, lon: number): XY {
  const x = (lon * Math.PI * R) / 180;
  const y = R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
  return { x, y };
}

export type Fit = {
  /** Where the image sits inside the box, in pixels. */
  image: { x: number; y: number; w: number; h: number };
  /** Ground metres per pixel, roughly. */
  pxPerM: number;
  project: (lat: number, lon: number) => XY;
  contains: (lat: number, lon: number) => boolean;
};

/**
 * Fit the imagery inside a width×height box, keeping its aspect, and return
 * a projector from lat/lon to pixels in that box.
 */
export function fit(
  width: number,
  height: number,
  img: Imagery = IMAGERY,
): Fit {
  const spanX = img.xmax - img.xmin;
  const spanY = img.ymax - img.ymin;
  const scale = Math.min(width / spanX, height / spanY);
  const w = spanX * scale;
  const h = spanY * scale;
  const x0 = (width - w) / 2;
  const y0 = (height - h) / 2;
  const midLat = (mercatorToLat(img.ymin) + mercatorToLat(img.ymax)) / 2;
  const project = (lat: number, lon: number): XY => {
    const m = mercator(lat, lon);
    return {
      x: x0 + ((m.x - img.xmin) / spanX) * w,
      y: y0 + ((img.ymax - m.y) / spanY) * h,
    };
  };
  const contains = (lat: number, lon: number) => {
    const m = mercator(lat, lon);
    return (
      m.x >= img.xmin && m.x <= img.xmax && m.y >= img.ymin && m.y <= img.ymax
    );
  };
  return {
    image: { x: x0, y: y0, w, h },
    pxPerM: scale / Math.cos((midLat * Math.PI) / 180),
    project,
    contains,
  };
}

export function mercatorToLat(y: number): number {
  return ((2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * 180) / Math.PI;
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

/** Buildings whose centre falls on the imagery. */
export function onImage(data: CampusData, f: Fit): Building[] {
  return data.buildings.filter((b) => f.contains(b.lat, b.lon));
}
