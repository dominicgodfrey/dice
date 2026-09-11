// Fixed-column packing with static spans and greedy gap fill (PLAN.md D8).
// Tiles are placed in order, each into the first free cell, scanning
// row-major, where its whole span fits. A gap left by a wide tile is filled
// by the next tile in order that fits it, so nothing reflows with content.
//
// A "fill" tile (D46) is placed after everything else and takes what is
// left: the free cells at the end of the last row, plus the free rows
// directly above them (a tall tile beside a 2x2), or a whole new row when
// that row is full. When the free run is one cell wide it also takes the
// whole next row, an L, rather than standing as a lonely column.

export type Span = { w: 1 | 2; h: 1 | 2 };

export type Cell = { x: number; y: number };

export type Placed<T> = {
  item: T;
  /** Bounding box in cells. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Every cell the tile covers; the whole box unless the tile is an L. */
  cells: Cell[];
};

export type Packed<T> = { placed: Placed<T>[]; rows: number };

function box(x: number, y: number, w: number, h: number): Cell[] {
  const cells: Cell[] = [];
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++) cells.push({ x: x + dx, y: y + dy });
  return cells;
}

/** True when the cells are exactly their bounding box. */
export function isBox<T>(p: Placed<T>): boolean {
  return p.cells.length === p.w * p.h;
}

export function pack<T>(
  items: readonly T[],
  span: (item: T) => Span,
  columns: number,
  fill: (item: T) => boolean = () => false,
): Packed<T> {
  const occupied = new Set<string>();
  const key = (x: number, y: number) => `${x},${y}`;
  const fits = (x: number, y: number, w: number, h: number) => {
    if (x + w > columns) return false;
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        if (occupied.has(key(x + dx, y + dy))) return false;
      }
    }
    return true;
  };
  const take = (cells: Cell[]) => {
    for (const c of cells) occupied.add(key(c.x, c.y));
  };

  const placed: Placed<T>[] = [];
  let rows = 0;
  for (const item of items) {
    if (fill(item)) continue;
    const { w, h } = span(item);
    const width = Math.min(w, columns);
    let y = 0;
    let done = false;
    while (!done) {
      for (let x = 0; x < columns && !done; x++) {
        if (fits(x, y, width, h)) {
          const cells = box(x, y, width, h);
          take(cells);
          placed.push({ item, x, y, w: width, h, cells });
          rows = Math.max(rows, y + h);
          done = true;
        }
      }
      y++;
    }
  }

  for (const item of items) {
    if (!fill(item)) continue;
    // Free cells at the right end of the last row, contiguous.
    const last = rows - 1;
    let free = 0;
    while (
      rows > 0 &&
      free < columns &&
      !occupied.has(key(columns - 1 - free, last))
    )
      free++;
    // And the rows above that are free across the same columns.
    let top = last;
    const x = columns - free;
    while (free > 0 && top > 0 && fits(x, top - 1, free, 1)) top--;
    let p: Placed<T>;
    if (free === 0) {
      p = {
        item,
        x: 0,
        y: rows,
        w: columns,
        h: 1,
        cells: box(0, rows, columns, 1),
      };
    } else if (free === 1 && columns > 1) {
      const stem = box(x, top, 1, last - top + 1);
      const cells = [...stem, ...box(0, rows, columns, 1)];
      p = { item, x: 0, y: top, w: columns, h: rows - top + 1, cells };
    } else {
      const h = last - top + 1;
      p = { item, x, y: top, w: free, h, cells: box(x, top, free, h) };
    }
    take(p.cells);
    placed.push(p);
    rows = Math.max(rows, p.y + p.h);
  }
  return { placed, rows };
}
