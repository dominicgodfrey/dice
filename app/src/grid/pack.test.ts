import { isBox, pack, type Span } from "./pack";

type T = { id: string; span: Span; fill?: true };
const t = (id: string, w: 1 | 2, h: 1 | 2): T => ({ id, span: { w, h } });
const f = (id: string): T => ({ id, span: { w: 2, h: 1 }, fill: true });
const runFill = (items: T[], columns: number) =>
  pack(
    items,
    (i) => i.span,
    columns,
    (i) => i.fill === true,
  ).placed.map((p) => ({
    id: p.item.id,
    x: p.x,
    y: p.y,
    w: p.w,
    h: p.h,
    cells: p.cells.length,
    box: isBox(p),
  }));
const run = (items: T[], columns: number) =>
  pack(items, (i) => i.span, columns).placed.map(
    (p) => `${p.item.id}@${p.x},${p.y}`,
  );

describe("pack", () => {
  it("lays 1x1 tiles left to right, top to bottom", () => {
    expect(run([t("a", 1, 1), t("b", 1, 1), t("c", 1, 1)], 2)).toEqual([
      "a@0,0",
      "b@1,0",
      "c@0,1",
    ]);
  });

  it("fills the gap left by a wide tile with the next tile that fits", () => {
    // a takes the first cell; b is 2 wide so it drops to row 1; c fills
    // the gap beside a.
    expect(run([t("a", 1, 1), t("b", 2, 1), t("c", 1, 1)], 2)).toEqual([
      "a@0,0",
      "b@0,1",
      "c@1,0",
    ]);
  });

  it("packs around a 2x2 tile", () => {
    expect(
      run([t("sky", 2, 2), t("a", 1, 1), t("b", 1, 1), t("c", 1, 1)], 3),
    ).toEqual(["sky@0,0", "a@2,0", "b@2,1", "c@0,2"]);
  });

  it("reports the row count", () => {
    expect(pack([t("a", 2, 1), t("b", 1, 2)], (i) => i.span, 2).rows).toBe(3);
  });

  it("lists every cell a box covers", () => {
    const p = pack([t("a", 2, 2)], (i) => i.span, 2).placed[0];
    expect(p.cells).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ]);
    expect(isBox(p)).toBe(true);
  });

  it("clamps a tile wider than the grid to the grid", () => {
    expect(pack([t("a", 2, 1)], (i) => i.span, 1).placed[0]).toMatchObject({
      x: 0,
      y: 0,
      w: 1,
    });
  });
});

describe("pack with a fill tile", () => {
  it("takes a whole new row when the last row is full", () => {
    expect(runFill([t("a", 1, 1), t("b", 1, 1), f("links")], 2)).toContainEqual(
      { id: "links", x: 0, y: 1, w: 2, h: 1, cells: 2, box: true },
    );
  });

  it("takes the tail of the last row when two or more cells are free", () => {
    expect(runFill([t("a", 1, 1), f("links")], 4)).toContainEqual({
      id: "links",
      x: 1,
      y: 0,
      w: 3,
      h: 1,
      cells: 3,
      box: true,
    });
  });

  it("makes an L from one free cell and the row below it", () => {
    const packed = pack(
      [t("a", 1, 1), f("links")],
      (i) => i.span,
      2,
      (i) => i.fill === true,
    );
    const links = packed.placed[1];
    expect(links).toMatchObject({ x: 0, y: 0, w: 2, h: 2 });
    expect(links.cells).toEqual([
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ]);
    expect(isBox(links)).toBe(false);
    expect(packed.rows).toBe(2);
  });

  it("grows the stem up the free column beside a 2x2", () => {
    const packed = pack(
      [t("sky", 2, 2), f("links")],
      (i) => i.span,
      3,
      (i) => i.fill === true,
    );
    const links = packed.placed[1];
    expect(links.cells).toEqual([
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ]);
    expect(links).toMatchObject({ x: 0, y: 0, w: 3, h: 3 });
    expect(packed.rows).toBe(3);
  });

  it("takes a free block, not just a row, when it is wider than one", () => {
    // 4 columns: sky 2x2 at the left leaves a 2x2 block at the right.
    const packed = pack(
      [t("sky", 2, 2), f("links")],
      (i) => i.span,
      4,
      (i) => i.fill === true,
    );
    expect(packed.placed[1]).toMatchObject({ x: 2, y: 0, w: 2, h: 2 });
    expect(isBox(packed.placed[1])).toBe(true);
  });

  it("goes last whatever its place in the order", () => {
    expect(runFill([f("links"), t("a", 1, 1), t("b", 1, 1)], 2)).toEqual([
      { id: "a", x: 0, y: 0, w: 1, h: 1, cells: 1, box: true },
      { id: "b", x: 1, y: 0, w: 1, h: 1, cells: 1, box: true },
      { id: "links", x: 0, y: 1, w: 2, h: 1, cells: 2, box: true },
    ]);
  });

  it("takes the first row of an empty grid", () => {
    expect(runFill([f("links")], 3)).toEqual([
      { id: "links", x: 0, y: 0, w: 3, h: 1, cells: 3, box: true },
    ]);
  });
});
