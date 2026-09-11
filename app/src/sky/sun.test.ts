import { lerpHex, skyFor, sunAltitude, sunTimes } from "./sun";

describe("sunAltitude", () => {
  it("is up at noon and down at midnight in Waltham", () => {
    // 2026-06-21, local Eastern Daylight Time.
    expect(sunAltitude(new Date("2026-06-21T17:00:00Z"))).toBeGreaterThan(60);
    expect(sunAltitude(new Date("2026-06-21T05:00:00Z"))).toBeLessThan(-10);
  });
});

describe("sunTimes", () => {
  it("finds a sunrise before a sunset on the same day", () => {
    const { sunrise, sunset } = sunTimes(new Date("2026-09-11T12:00:00"));
    expect(sunrise).not.toBeNull();
    expect(sunset).not.toBeNull();
    expect(sunrise!.getTime()).toBeLessThan(sunset!.getTime());
  });
});

describe("lerpHex", () => {
  it("interpolates channels", () => {
    expect(lerpHex("#000000", "#FFFFFF", 0.5)).toBe("#808080");
    expect(lerpHex("#FF0000", "#00FF00", 0)).toBe("#FF0000");
    expect(lerpHex("#FF0000", "#00FF00", 1)).toBe("#00FF00");
  });
});

describe("skyFor", () => {
  it("is dark at night and light by day", () => {
    expect(skyFor(-40).dark).toBe(true);
    expect(skyFor(-40).label).toBe("Night");
    expect(skyFor(45).dark).toBe(false);
    expect(skyFor(45).label).toBe("Day");
  });
  it("hits the stops exactly", () => {
    expect(skyFor(0).top).toBe("#6A7DBF");
    expect(skyFor(20).bottom).toBe("#BFE0FF");
  });
  it("clamps out-of-range altitudes", () => {
    expect(skyFor(-200)).toEqual(skyFor(-90));
    expect(skyFor(200)).toEqual(skyFor(90));
  });
});
