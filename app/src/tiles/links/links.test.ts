import { layoutIcons, linkEntries, toggleLink } from "./links";

describe("linkEntries", () => {
  it("defaults when empty and drops unknown or non-url ids", () => {
    expect(linkEntries({ promoted: [] }).map((e) => e.id)).toEqual([
      "moodle",
      "workday",
      "campusgroups",
      "grubhub",
    ]);
    expect(
      linkEntries({ promoted: ["libcal", "nope", "emergency"] }).map(
        (e) => e.id,
      ),
    ).toEqual(["libcal"]);
  });
});

describe("toggleLink", () => {
  it("starts from the defaults", () => {
    const off = toggleLink({ promoted: [] }, "moodle");
    expect(off.promoted).toEqual(["workday", "campusgroups", "grubhub"]);
    expect(toggleLink(off, "moodle").promoted).toContain("moodle");
  });
});

describe("layoutIcons", () => {
  it("fills one wide box with a row when few, two rows when more", () => {
    const four = layoutIcons(4, [{ w: 300, h: 140 }], 8);
    expect(four.counts).toEqual([4]);
    expect(four.size).toBe(69); // (300 - 3*8) / 4, floored
    const six = layoutIcons(6, [{ w: 300, h: 140 }], 8);
    expect(six.size).toBe(66); // two rows: (140 - 8) / 2
    expect(six.counts).toEqual([6]);
  });

  it("uses one size across an L of three cells and fills in order", () => {
    const cells = [
      { w: 120, h: 90 },
      { w: 120, h: 120 },
      { w: 120, h: 120 },
    ];
    const l = layoutIcons(5, cells, 8);
    expect(l.counts.reduce((a, b) => a + b, 0)).toBe(5);
    expect(l.counts[0]).toBeGreaterThan(0);
    // Every box holds its share at that size.
    for (const [i, b] of cells.entries()) {
      const across = Math.floor((b.w + 8) / (l.size + 8));
      const down = Math.floor((b.h + 8) / (l.size + 8));
      expect(l.counts[i]).toBeLessThanOrEqual(across * down);
    }
  });

  it("never lets icons exceed a box", () => {
    for (let n = 1; n <= 12; n++) {
      const { size, counts } = layoutIcons(n, [{ w: 250, h: 120 }], 6);
      expect(size).toBeLessThanOrEqual(120);
      expect(counts).toEqual([n]);
    }
  });

  it("copes with nothing to lay out", () => {
    expect(layoutIcons(0, [{ w: 100, h: 100 }])).toEqual({
      size: 0,
      counts: [0],
    });
    expect(layoutIcons(3, [{ w: 0, h: 0 }])).toEqual({
      size: 0,
      counts: [0],
    });
  });
});
