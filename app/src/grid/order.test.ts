import type { TileDef } from "../tiles/registry";
import {
  hideTile,
  move,
  orderFromVisible,
  orderedTiles,
  showTile,
  visibleTiles,
} from "./order";

const def = (id: string): TileDef =>
  ({ id, title: id, span: { w: 1, h: 1 }, color: "#000" }) as TileDef;
const ALL = [def("a"), def("b"), def("c"), def("d")];
const ids = (tiles: TileDef[]) => tiles.map((t) => t.id);

describe("orderedTiles", () => {
  it("uses registry order when nothing is stored", () => {
    expect(ids(orderedTiles({ order: [] }, ALL))).toEqual(["a", "b", "c", "d"]);
  });
  it("follows the stored order, drops unknown IDs, appends new tiles", () => {
    expect(ids(orderedTiles({ order: ["c", "zzz", "a", "a"] }, ALL))).toEqual([
      "c",
      "a",
      "b",
      "d",
    ]);
  });
});

describe("visibleTiles", () => {
  it("filters hidden tiles without disturbing order", () => {
    expect(
      ids(visibleTiles({ order: ["d", "c"], hidden: ["c"] }, ALL)),
    ).toEqual(["d", "a", "b"]);
  });
});

describe("move", () => {
  it("moves an element forward and back", () => {
    expect(move(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
    expect(move(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
  });
});

describe("orderFromVisible", () => {
  it("keeps hidden tiles after the visible ones", () => {
    expect(
      orderFromVisible({ order: [], hidden: ["b"] }, ["d", "a", "c"], ALL),
    ).toEqual(["d", "a", "c", "b"]);
  });
});

describe("hideTile and showTile", () => {
  it("hides once", () => {
    expect(hideTile({ order: [], hidden: ["a"] }, "a")).toEqual({
      hidden: ["a"],
    });
    expect(hideTile({ order: [], hidden: [] }, "a")).toEqual({ hidden: ["a"] });
  });
  it("shows at the end of the grid", () => {
    expect(
      showTile({ order: ["a", "b", "c", "d"], hidden: ["b"] }, "b", ALL),
    ).toEqual({
      order: ["a", "c", "d", "b"],
      hidden: [],
    });
  });
});
