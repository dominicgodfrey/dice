import { CONSTELLATIONS, STAR_BY_ID, STARS } from "./catalog";
import { chartAt, constellationsUp, placeStar, toDisc } from "./chart";
import { CAMPUS } from "./sun";

const campus = { lat: CAMPUS.lat, lon: CAMPUS.lon };

describe("catalog", () => {
  it("has unique ids and every line refers to a known star", () => {
    const ids = new Set(STARS.map((s) => s.id));
    expect(ids.size).toBe(STARS.length);
    for (const c of CONSTELLATIONS) {
      for (const path of c.lines)
        for (const id of path) expect(STAR_BY_ID.has(id)).toBe(true);
    }
  });
});

describe("placeStar", () => {
  it("puts Polaris at an altitude equal to the latitude, due north", () => {
    const p = placeStar(
      STAR_BY_ID.get("polaris")!,
      new Date("2026-09-11T03:00:00Z"),
      campus,
    );
    expect(p.alt).toBeCloseTo(CAMPUS.lat, 0);
    expect(Math.min(p.az, 360 - p.az)).toBeLessThan(2);
  });
});

describe("chartAt", () => {
  it("shows the summer triangle high on a September evening in Waltham", () => {
    // 2026-09-11 22:00 EDT
    const chart = chartAt(new Date("2026-09-12T02:00:00Z"), campus);
    const alt = (id: string) =>
      chart.stars.find((s) => s.id === id)?.alt ?? -99;
    expect(alt("vega")).toBeGreaterThan(50);
    expect(alt("deneb")).toBeGreaterThan(50);
    expect(alt("altair")).toBeGreaterThan(30);
    // Orion is a winter constellation: not up.
    expect(chart.stars.find((s) => s.id === "betelgeuse")).toBeUndefined();
    const up = constellationsUp(chart).map((c) => c.abbr);
    expect(up).toContain("Cyg");
    expect(up).toContain("Lyr");
    expect(up).not.toContain("Ori");
    expect(chart.lines.length).toBeGreaterThan(20);
  });
});

describe("toDisc", () => {
  it("puts the zenith at the centre and the north horizon at the top", () => {
    const z = toDisc(90, 123);
    expect(Math.abs(z.x)).toBeLessThan(1e-9);
    expect(Math.abs(z.y)).toBeLessThan(1e-9);
    const n = toDisc(0, 0);
    expect(n.y).toBeCloseTo(-1);
    expect(n.x).toBeCloseTo(0);
    // Looking up, east is on the left.
    const e = toDisc(0, 90);
    expect(e.x).toBeCloseTo(-1);
  });
  it("rotates with the heading", () => {
    const e = toDisc(0, 90, 90);
    expect(e.y).toBeCloseTo(-1);
  });
});
