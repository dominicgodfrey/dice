import type { CampusData } from "../sources/types";
import {
  detailLevel,
  fit,
  IMAGERY,
  mercator,
  mercatorToLat,
  onImage,
} from "./campus";

describe("mercator", () => {
  it("round-trips latitude and grows east", () => {
    const m = mercator(42.3665, -71.26);
    expect(mercatorToLat(m.y)).toBeCloseTo(42.3665, 6);
    expect(mercator(42.3665, -71.25).x).toBeGreaterThan(m.x);
    // Inside the exported extent.
    expect(m.x).toBeGreaterThan(IMAGERY.xmin);
    expect(m.x).toBeLessThan(IMAGERY.xmax);
    expect(m.y).toBeGreaterThan(IMAGERY.ymin);
    expect(m.y).toBeLessThan(IMAGERY.ymax);
  });
});

describe("fit", () => {
  it("keeps the image aspect, centres it, and projects north-up", () => {
    const f = fit(400, 300);
    expect(f.image.w).toBeCloseTo(f.image.h, 3);
    expect(f.image.x).toBeCloseTo((400 - f.image.w) / 2, 6);
    const rabb = f.project(42.366, -71.26);
    const north = f.project(42.37, -71.26);
    expect(north.y).toBeLessThan(rabb.y);
    expect(rabb.x).toBeGreaterThan(f.image.x);
    expect(rabb.x).toBeLessThan(f.image.x + f.image.w);
    expect(f.pxPerM).toBeGreaterThan(0.1);
    expect(f.pxPerM).toBeLessThan(1);
  });
  it("knows what falls off the imagery", () => {
    const f = fit(400, 400);
    const data: CampusData = {
      updated: "",
      origin: { lat: 42.3665, lon: -71.26 },
      buildings: [
        {
          id: "a",
          name: "A",
          kind: "academic",
          lat: 42.3665,
          lon: -71.26,
          w: 1,
          h: 1,
          rot: 0,
          entrances: [],
          rooms: [],
        },
        {
          id: "far",
          name: "Far",
          kind: "academic",
          lat: 42.5,
          lon: -71.26,
          w: 1,
          h: 1,
          rot: 0,
          entrances: [],
          rooms: [],
        },
      ],
      places: [],
      photos: [],
    };
    expect(onImage(data, f).map((b) => b.id)).toEqual(["a"]);
  });
});

describe("detailLevel", () => {
  it("steps up with zoom", () => {
    expect(detailLevel(1)).toBe(1);
    expect(detailLevel(2)).toBe(2);
    expect(detailLevel(3.5)).toBe(3);
  });
});
