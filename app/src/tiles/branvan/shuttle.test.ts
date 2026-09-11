import type { ShuttleData } from "../../sources/types";
import {
  alongRoute,
  arrivalsAt,
  minutesLabel,
  project,
  routeServing,
  stopsOnRoute,
} from "./shuttle";

const data: ShuttleData = {
  updated: "",
  routes: [
    { id: "a", name: "A", color: "#000", stops: ["s1", "s2"] },
    { id: "b", name: "B", color: "#111", stops: ["s2", "s3"] },
  ],
  stops: [
    { id: "s1", name: "One", lat: 42.0, lon: -71.0 },
    { id: "s2", name: "Two", lat: 42.01, lon: -71.01 },
    { id: "s3", name: "Three", lat: 42.02, lon: -71.0 },
  ],
  arrivals: [
    { stopId: "s2", routeId: "a", minutes: [12, 3] },
    { stopId: "s2", routeId: "b", minutes: [7] },
    { stopId: "s2", routeId: "zzz", minutes: [1] },
  ],
};

describe("arrivalsAt", () => {
  it("merges routes, sorts by time, drops unknown routes", () => {
    expect(
      arrivalsAt(data, "s2").map((a) => `${a.routeId}${a.minutes}`),
    ).toEqual(["a3", "b7", "a12"]);
  });
});

describe("minutesLabel", () => {
  it("phrases minutes", () => {
    expect(minutesLabel(0)).toBe("Now");
    expect(minutesLabel(1)).toBe("1 min");
    expect(minutesLabel(6)).toBe("6 min");
  });
});

describe("stopsOnRoute", () => {
  it("returns stops in route order", () => {
    expect(stopsOnRoute(data, "b").map((s) => s.name)).toEqual([
      "Two",
      "Three",
    ]);
    expect(stopsOnRoute(data, "nope")).toEqual([]);
  });
});

describe("routeServing", () => {
  it("finds the first route through a stop", () => {
    expect(routeServing(data, "s3")).toBe("b");
    expect(routeServing(data, "nope")).toBeNull();
  });
});

describe("alongRoute", () => {
  it("places stops by distance and projects vehicles onto the line", () => {
    const stops = [
      { id: "a", name: "A", lat: 42.0, lon: -71.0 },
      { id: "b", name: "B", lat: 42.0, lon: -71.01 },
      { id: "c", name: "C", lat: 42.0, lon: -71.03 },
    ];
    const r = alongRoute(stops, [
      { id: "v1", routeId: "r", lat: 42.0001, lon: -71.02 },
      { id: "far", routeId: "r", lat: 42.1, lon: -71.02 },
    ]);
    expect(r.stops[0]).toBe(0);
    expect(r.stops[1]).toBeCloseTo(1 / 3, 2);
    expect(r.stops[2]).toBe(1);
    expect(r.vehicles).toHaveLength(1);
    expect(r.vehicles[0].t).toBeCloseTo(2 / 3, 2);
  });
});

describe("project", () => {
  it("fits stops inside the box with north up", () => {
    const { points: p } = project(data.stops, 200, 100, 10);
    const s1 = p.get("s1")!;
    const s3 = p.get("s3")!;
    expect(s3.y).toBeLessThan(s1.y);
    for (const { x, y } of p.values()) {
      expect(x).toBeGreaterThanOrEqual(10);
      expect(x).toBeLessThanOrEqual(190);
      expect(y).toBeGreaterThanOrEqual(10);
      expect(y).toBeLessThanOrEqual(90);
    }
  });
});
