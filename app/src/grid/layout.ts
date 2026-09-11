// Grid values (PLAN.md D28) and the expanded-view cap (D27).

export const GUTTER = 12;
export const MAX_CONTENT_WIDTH = 1200;
export const EXPANDED_MAX_WIDTH = 720;
export const EXPANDED_DESKTOP_MARGIN = 32;
export const TILE_RADIUS = 20;
/** Above this width the layout is "wide": more columns, expansion is a capped modal. */
export const WIDE_BREAKPOINT = 768;

export function columnsForWidth(width: number): number {
  if (width < 768) return 2;
  if (width < 1024) return 3;
  return 4;
}

/** Width of a 1x1 cell for a given content width and column count. */
export function cellSize(contentWidth: number, columns: number): number {
  return (contentWidth - GUTTER * (columns - 1)) / columns;
}

/**
 * Height of a 1x1 cell: square on a phone, capped above so a two-wide tile
 * on a tablet or desktop is not a huge empty square (D28, revised).
 */
export const UNIT_MAX_HEIGHT = 200;

export function unitHeight(cell: number): number {
  return Math.min(cell, UNIT_MAX_HEIGHT);
}

export function contentWidthFor(windowWidth: number, padding: number): number {
  return Math.min(windowWidth - padding * 2, MAX_CONTENT_WIDTH);
}

export type Rect = { x: number; y: number; width: number; height: number };

/** Where an expanded tile ends up: the whole window on a phone, a capped, centred card when wide. */
export function expandedRect(windowWidth: number, windowHeight: number): Rect {
  if (windowWidth <= WIDE_BREAKPOINT) {
    return { x: 0, y: 0, width: windowWidth, height: windowHeight };
  }
  const width = Math.min(
    windowWidth - EXPANDED_DESKTOP_MARGIN * 2,
    EXPANDED_MAX_WIDTH,
  );
  const height = windowHeight - EXPANDED_DESKTOP_MARGIN * 2;
  return {
    x: (windowWidth - width) / 2,
    y: EXPANDED_DESKTOP_MARGIN,
    width,
    height,
  };
}
