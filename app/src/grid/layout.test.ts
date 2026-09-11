import { cellSize, columnsForWidth, expandedRect, unitHeight } from "./layout";

describe("columnsForWidth", () => {
  it("follows D28", () => {
    expect(columnsForWidth(390)).toBe(2);
    expect(columnsForWidth(767)).toBe(2);
    expect(columnsForWidth(768)).toBe(3);
    expect(columnsForWidth(1023)).toBe(3);
    expect(columnsForWidth(1024)).toBe(4);
  });
});

describe("cellSize", () => {
  it("splits the width evenly after gutters", () => {
    expect(cellSize(360, 2)).toBe(174);
  });
});

describe("expandedRect", () => {
  it("fills a phone", () => {
    expect(expandedRect(390, 844)).toEqual({
      x: 0,
      y: 0,
      width: 390,
      height: 844,
    });
  });
  it("caps and centres on desktop", () => {
    expect(expandedRect(1440, 900)).toEqual({
      x: 360,
      y: 32,
      width: 720,
      height: 836,
    });
  });
});

describe("unitHeight", () => {
  it("is square on a phone and capped above", () => {
    expect(unitHeight(174)).toBe(174);
    expect(unitHeight(303)).toBe(200);
  });
});
