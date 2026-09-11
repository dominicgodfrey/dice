import { arcAt, bezierPoint } from "./arc";

describe("arcAt", () => {
  it("is the sun's arc during the day", () => {
    const now = new Date("2026-09-11T12:00:00");
    const arc = arcAt(now)!;
    expect(arc.body).toBe("sun");
    expect(arc.start.getTime()).toBeLessThanOrEqual(now.getTime());
    expect(arc.end.getTime()).toBeGreaterThan(now.getTime());
    expect(arc.t).toBeGreaterThan(0.3);
    expect(arc.t).toBeLessThan(0.7);
    expect(arc.startLabel).toBe("Sunrise");
  });

  it("is the moon's arc, or the night, once the sun is down", () => {
    const now = new Date("2026-09-11T23:30:00");
    const arc = arcAt(now)!;
    expect(arc.body).not.toBe("sun");
    expect(arc.start.getTime()).toBeLessThanOrEqual(now.getTime());
    expect(arc.end.getTime()).toBeGreaterThan(now.getTime());
    if (arc.body === "moon") {
      expect(arc.startLabel).toBe("Moonrise");
    } else {
      expect(arc.startLabel).toBe("Sunset");
      expect(arc.endLabel).toBe("Sunrise");
    }
  });

  it("finds a moon arc on a night the moon is up", () => {
    // 2026-09-26, first quarter: the moon sets around midnight.
    const arc = arcAt(new Date("2026-09-26T21:00:00"))!;
    expect(arc.body).toBe("moon");
    expect(arc.t).toBeGreaterThan(0);
    expect(arc.t).toBeLessThan(1);
  });

  it("stays before midnight's sunrise on the hour after sunset", () => {
    const arc = arcAt(new Date("2026-09-11T19:30:00"))!;
    expect(arc.body).not.toBe("sun");
    expect(arc.t).toBeLessThan(0.2);
  });
});

describe("bezierPoint", () => {
  it("hits the ends and the middle", () => {
    expect(bezierPoint([0, 10], [5, 0], [10, 10], 0)).toEqual([0, 10]);
    expect(bezierPoint([0, 10], [5, 0], [10, 10], 1)).toEqual([10, 10]);
    expect(bezierPoint([0, 10], [5, 0], [10, 10], 0.5)).toEqual([5, 5]);
  });
});
