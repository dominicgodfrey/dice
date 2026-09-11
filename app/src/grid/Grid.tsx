// The home grid (PLAN.md D8, D28): fixed columns, static spans, greedy gap
// fill, every tile absolutely positioned from the packer's output so a later
// drag can animate positions directly.

import { useEffect, useMemo, useRef } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useExpand } from "../expand/ExpandProvider";
import { TILES, type TileDef } from "../tiles/registry";
import { Tile } from "../tiles/Tile";
import {
  cellSize,
  columnsForWidth,
  contentWidthFor,
  GUTTER,
  TILE_RADIUS,
  type Rect,
} from "./layout";
import { pack } from "./pack";

const PADDING = 16;

export function Grid() {
  const { width: winW } = useWindowDimensions();
  const contentWidth = contentWidthFor(winW, PADDING);
  const columns = columnsForWidth(winW);
  const cell = cellSize(contentWidth, columns);
  const { placed, rows } = useMemo(
    () => pack(TILES, (t) => t.span, columns),
    [columns],
  );
  const height = rows * cell + (rows - 1) * GUTTER;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={{ width: contentWidth, height }}>
        {placed.map((p) => (
          <GridTile
            key={p.item.id}
            def={p.item}
            rect={{
              x: p.x * (cell + GUTTER),
              y: p.y * (cell + GUTTER),
              width: p.w * cell + (p.w - 1) * GUTTER,
              height: p.h * cell + (p.h - 1) * GUTTER,
            }}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function GridTile({ def, rect }: { def: TileDef; rect: Rect }) {
  const { registerTile, expand } = useExpand();
  const ref = useRef<View>(null);

  useEffect(
    () =>
      registerTile(
        def.id,
        () =>
          new Promise((resolve) => {
            const node = ref.current;
            if (!node) return resolve(rect);
            node.measureInWindow((x, y, width, height) =>
              resolve({ x, y, width, height }),
            );
          }),
      ),
    [def.id, registerTile, rect],
  );

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={def.title}
      onPress={() => expand(def.id)}
      style={({ pressed }) => [
        styles.tile,
        {
          left: rect.x,
          top: rect.y,
          width: rect.width,
          height: rect.height,
          backgroundColor: def.color,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      <Tile def={def} expanded={false} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: "center", padding: PADDING, paddingBottom: 120 },
  tile: { position: "absolute", borderRadius: TILE_RADIUS, overflow: "hidden" },
});
