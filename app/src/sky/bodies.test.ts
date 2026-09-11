import { aboveHorizon, bodiesAt, compassPoint, moonPhase } from "./bodies";

describe("bodiesAt", () => {
  it("lists sun, moon and five planets with positions", () => {
    const bodies = bodiesAt(new Date("2026-09-11T22:00:00Z"));
    expect(bodies.map((b) => b.id).sort()).toEqual(
      ["jupiter", "mars", "mercury", "moon", "saturn", "sun", "venus"].sort(),
    );
    for (const b of bodies) {
      expect(b.altitude).toBeGreaterThanOrEqual(-90);
      expect(b.altitude).toBeLessThanOrEqual(90);
      expect(b.azimuth).toBeGreaterThanOrEqual(0);
      expect(b.azimuth).toBeLessThan(360);
    }
  });
  it("puts the sun below the horizon at local midnight", () => {
    const sun = bodiesAt(new Date("2026-09-12T04:00:00Z")).find(
      (b) => b.id === "sun",
    )!;
    expect(sun.altitude).toBeLessThan(0);
    expect(aboveHorizon([sun])).toEqual([]);
  });
});

describe("moonPhase", () => {
  it("returns a fraction in range and a name", () => {
    const p = moonPhase(new Date("2026-09-11T00:00:00Z"));
    expect(p.fraction).toBeGreaterThanOrEqual(0);
    expect(p.fraction).toBeLessThanOrEqual(1);
    expect(p.name.length).toBeGreaterThan(0);
  });
});

describe("compassPoint", () => {
  it("maps azimuths to points", () => {
    expect(compassPoint(0)).toBe("N");
    expect(compassPoint(45)).toBe("NE");
    expect(compassPoint(180)).toBe("S");
    expect(compassPoint(359)).toBe("N");
    expect(compassPoint(-90)).toBe("W");
  });
});
