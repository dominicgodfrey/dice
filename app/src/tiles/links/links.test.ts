import { iconGrid, linkEntries, toggleLink } from "./links";

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

describe("iconGrid", () => {
  it("fills a wide tile with one row when few, two rows when more", () => {
    expect(iconGrid(4, 300, 140, 8)).toMatchObject({ cols: 4, rows: 1 });
    expect(iconGrid(6, 300, 140, 8)).toMatchObject({ cols: 3, rows: 2 });
    expect(iconGrid(8, 300, 140, 8)).toMatchObject({ cols: 4, rows: 2 });
  });
  it("gives one icon the whole box", () => {
    expect(iconGrid(1, 100, 80)).toEqual({ cols: 1, rows: 1, cell: 80 });
  });
  it("never lets cells exceed the box", () => {
    for (let n = 1; n <= 12; n++) {
      const g = iconGrid(n, 250, 120, 6);
      expect(g.cols * g.cell + (g.cols - 1) * 6).toBeLessThanOrEqual(250.001);
      expect(g.rows * g.cell + (g.rows - 1) * 6).toBeLessThanOrEqual(120.001);
    }
  });
});
