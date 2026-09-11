// Fixed-column packing with static spans and greedy gap fill (PLAN.md D8).
// Tiles are placed in order, each into the first free cell, scanning
// row-major, where its whole span fits. A gap left by a wide tile is filled
// by the next tile in order that fits it, so nothing reflows with content.

export type Span = { w: 1 | 2; h: 1 | 2 };

export type Placed<T> = { item: T; x: number; y: number; w: number; h: number };

export type Packed<T> = { placed: Placed<T>[]; rows: number };

export function pack<T>(
  items: readonly T[],
  span: (item: T) => Span,
  columns: number,
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

  const placed: Placed<T>[] = [];
  let rows = 0;
  for (const item of items) {
    const { w, h } = span(item);
    const width = Math.min(w, columns);
    let y = 0;
    let done = false;
    while (!done) {
      for (let x = 0; x < columns && !done; x++) {
        if (fits(x, y, width, h)) {
          for (let dy = 0; dy < h; dy++) {
            for (let dx = 0; dx < width; dx++)
              occupied.add(key(x + dx, y + dy));
          }
          placed.push({ item, x, y, w: width, h });
          rows = Math.max(rows, y + h);
          done = true;
        }
      }
      y++;
    }
  }
  return { placed, rows };
}
