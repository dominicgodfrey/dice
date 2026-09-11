import { pack, type Span } from "./pack";

type T = { id: string; span: Span };
const t = (id: string, w: 1 | 2, h: 1 | 2): T => ({ id, span: { w, h } });
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

  it("clamps a tile wider than the grid to the grid", () => {
    expect(pack([t("a", 2, 1)], (i) => i.span, 1).placed[0]).toMatchObject({
      x: 0,
      y: 0,
      w: 1,
    });
  });
});
