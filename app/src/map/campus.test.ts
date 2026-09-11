import type { CampusData } from "../sources/types";
import { bounds, detailLevel, fit, toLocal } from "./campus";

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
      w: 40,
      h: 40,
      rot: 0,
      entrances: [],
      rooms: [],
    },
    {
      id: "b",
      name: "B",
      kind: "residence",
      lat: 42.3674,
      lon: -71.2588,
      w: 40,
      h: 40,
      rot: 0,
      entrances: [],
      rooms: [],
    },
  ],
  places: [],
  photos: [],
};

describe("toLocal", () => {
  it("is zero at the origin and grows east and north", () => {
    expect(toLocal(data, 42.3665, -71.26)).toEqual({ x: 0, y: 0 });
    const p = toLocal(data, 42.3674, -71.2588);
    expect(p.x).toBeGreaterThan(90);
    expect(p.y).toBeCloseTo(99.9, 0);
  });
});

describe("bounds and fit", () => {
  it("fits everything inside the box, north up", () => {
    const b = bounds(data, 10);
    expect(b.minX).toBeLessThan(-20);
    const { project } = fit(data, 400, 300);
    const a = project(42.3665, -71.26);
    const bb = project(42.3674, -71.2588);
    expect(bb.y).toBeLessThan(a.y);
    expect(bb.x).toBeGreaterThan(a.x);
    for (const p of [a, bb]) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(400);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(300);
    }
  });
});

describe("detailLevel", () => {
  it("steps up with zoom", () => {
    expect(detailLevel(1)).toBe(1);
    expect(detailLevel(2)).toBe(2);
    expect(detailLevel(3.5)).toBe(3);
  });
});
