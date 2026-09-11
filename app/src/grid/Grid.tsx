// The home grid (PLAN.md D8, D28): fixed columns, static spans, greedy gap
// fill, every tile absolutely positioned from the packer's output and
// springing to its place when the order changes.
//
// Long-press opens a menu (D11): Move, Colour, Hide, Edit tiles. Move lifts
// the tile; a pan then carries it, the others flow around the gap the
// packer leaves for it, release commits the order, and tapping anywhere
// else flows everything back. Drag positions live in shared values written
// only from gesture callbacks. The order being dragged is the stored order
// itself, updated through the store on every cell change; cancelling puts
// back the snapshot taken when the move began.

import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Header } from "../chrome/Header";
import { useExpand } from "../expand/ExpandProvider";
import { usePreferences } from "../preferences/store";
import {
  TILE_BY_ID,
  TILES,
  tileColor,
  type TileDef,
  type TileId,
} from "../tiles/registry";
import { Tile } from "../tiles/Tile";
import { Icon } from "../ui/Icon";
import { Text } from "../ui/Text";
import { colors, isPaletteKey, radius, space, type } from "../ui/theme";
import { ColorSheet } from "./ColorSheet";
import {
  cellSize,
  columnsForWidth,
  contentWidthFor,
  GUTTER,
  TILE_RADIUS,
  unitHeight,
  type Rect,
} from "./layout";
import {
  hideTile,
  move,
  orderedTiles,
  orderFromVisible,
  visibleTiles,
} from "./order";
import { pack, type Placed } from "./pack";
import { TileMenu } from "./TileMenu";

const PADDING = 16;
const SPRING = { damping: 24, stiffness: 260 };

export function Grid() {
  const router = useRouter();
  const { prefs, loaded, update } = usePreferences();
  const { width: winW } = useWindowDimensions();
  const contentWidth = contentWidthFor(winW, PADDING);
  const columns = columnsForWidth(winW);
  const cell = cellSize(contentWidth, columns);
  const unit = unitHeight(cell);
  const stride = cell + GUTTER;
  const strideY = unit + GUTTER;

  const tiles = useMemo(() => visibleTiles(prefs, TILES), [prefs]);
  const [menuFor, setMenuFor] = useState<TileId | null>(null);
  const [colorFor, setColorFor] = useState<TileId | null>(null);
  const [movingId, setMovingId] = useState<TileId | null>(null);
  // The order before the move began, restored on cancel.
  const [original, setOriginal] = useState<string[] | null>(null);

  const { placed, rows } = useMemo(
    () => pack(tiles, (t) => t.span, columns),
    [tiles, columns],
  );
  const height = Math.max(rows * unit + (rows - 1) * GUTTER, unit);
  const rectOf = (p: Placed<TileDef>): Rect => ({
    x: p.x * stride,
    y: p.y * strideY,
    width: p.w * cell + (p.w - 1) * GUTTER,
    height: p.h * unit + (p.h - 1) * GUTTER,
  });

  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const lastCell = useSharedValue(-1);

  const movingPlaced = movingId
    ? placed.find((p) => p.item.id === movingId)
    : undefined;
  const movingRect = movingPlaced ? rectOf(movingPlaced) : null;

  const beginMove = (id: TileId) => {
    const p = placed.find((x) => x.item.id === id);
    if (!p) return;
    const r = rectOf(p);
    dragX.value = r.x;
    dragY.value = r.y;
    lastCell.value = -1;
    setMenuFor(null);
    setOriginal(orderedTiles(prefs, TILES).map((t) => t.id));
    setMovingId(id);
  };

  const cancelMove = () => {
    if (original) update({ order: original });
    setOriginal(null);
    setMovingId(null);
  };

  const finishMove = () => {
    setOriginal(null);
    setMovingId(null);
  };

  // The finger is over grid cell (col, row): put the moving tile where the
  // tile under the finger is, and let the packer open the gap. Reads the
  // latest stored order through the functional update, so it never acts
  // on a stale render.
  const hoverCell = (col: number, row: number) => {
    const moving = movingId;
    if (!moving) return;
    update((p) => {
      const w = visibleTiles(p, TILES);
      const from = w.findIndex((t) => t.id === moving);
      if (from < 0) return {};
      const { placed: laid, rows: laidRows } = pack(w, (t) => t.span, columns);
      const covers = (q: Placed<TileDef>) =>
        col >= q.x && col < q.x + q.w && row >= q.y && row < q.y + q.h;
      const own = laid.find((q) => q.item.id === moving);
      if (own && covers(own)) return {};
      const hit = laid.find((q) => q.item.id !== moving && covers(q));
      let to: number;
      if (hit) to = w.findIndex((t) => t.id === hit.item.id);
      else if (row >= laidRows) to = w.length - 1;
      else return {};
      if (to === from) return {};
      const next = move(w, from, to).map((t) => t.id);
      return { order: orderFromVisible(p, next, TILES) };
    });
  };

  const movingW = movingRect?.width ?? 0;
  const movingH = movingRect?.height ?? 0;
  const pan = Gesture.Pan()
    .minDistance(0)
    .onStart(() => {
      startX.value = dragX.value;
      startY.value = dragY.value;
    })
    .onUpdate((e) => {
      dragX.value = startX.value + e.translationX;
      dragY.value = startY.value + e.translationY;
      const cx = dragX.value + movingW / 2;
      const cy = dragY.value + movingH / 2;
      const col = Math.min(columns - 1, Math.max(0, Math.floor(cx / stride)));
      const row = Math.max(0, Math.floor(cy / strideY));
      const key = row * columns + col;
      if (key !== lastCell.value) {
        lastCell.value = key;
        scheduleOnRN(hoverCell, col, row);
      }
    })
    .onEnd(() => {
      scheduleOnRN(finishMove);
    });

  // Escape cancels a move or closes a sheet on web.
  useEffect(() => {
    if (Platform.OS !== "web" || (!movingId && !menuFor && !colorFor)) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenuFor(null);
      setColorFor(null);
      if (original) update({ order: original });
      setOriginal(null);
      setMovingId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [movingId, menuFor, colorFor, original, update]);

  if (!loaded) return <View style={styles.root} />;

  const menuTile = menuFor ? TILE_BY_ID.get(menuFor) : undefined;
  const colorTile = colorFor ? TILE_BY_ID.get(colorFor) : undefined;
  const chosenRaw = colorTile ? prefs.colors[colorTile.id] : undefined;
  const chosenKey = isPaletteKey(chosenRaw)
    ? chosenRaw
    : (colorTile?.paletteKey ?? "ink");

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        scrollEnabled={!movingId}
      >
        <Header />
        <View style={styles.content}>
          <View style={{ width: contentWidth, height }}>
            {movingId ? (
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={cancelMove}
                accessibilityLabel="Cancel move"
              />
            ) : null}
            {movingRect ? <Gap rect={movingRect} /> : null}
            {placed.map((p) => {
              const moving = p.item.id === movingId;
              const tile = (
                <GridTile
                  key={p.item.id}
                  def={p.item}
                  color={tileColor(prefs, p.item)}
                  rect={rectOf(p)}
                  moving={moving}
                  dragX={dragX}
                  dragY={dragY}
                  onPress={movingId ? cancelMove : undefined}
                  onLongPress={
                    movingId ? undefined : () => setMenuFor(p.item.id)
                  }
                />
              );
              return moving ? (
                <GestureDetector key={p.item.id} gesture={pan}>
                  {tile}
                </GestureDetector>
              ) : (
                tile
              );
            })}
          </View>
          {movingId ? (
            <Text style={styles.hint}>
              Drag to a new spot. Tap anywhere else to cancel.
            </Text>
          ) : (
            <Pressable
              onPress={() => router.push("/edit")}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.editButton,
                pressed && styles.pressed,
              ]}
            >
              <Icon name="sliders" size={15} color={colors.muted} />
              <Text style={styles.editLabel}>Edit tiles</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
      {menuTile ? (
        <TileMenu
          title={menuTile.title}
          onMove={() => beginMove(menuTile.id)}
          onColor={() => {
            setMenuFor(null);
            setColorFor(menuTile.id);
          }}
          onHide={() => {
            setMenuFor(null);
            update((p) => hideTile(p, menuTile.id));
          }}
          onEdit={() => {
            setMenuFor(null);
            router.push("/edit");
          }}
          onClose={() => setMenuFor(null)}
        />
      ) : null}
      {colorTile ? (
        <ColorSheet
          title={colorTile.title}
          current={chosenKey}
          onPick={(key) => {
            update((p) => ({ colors: { ...p.colors, [colorTile.id]: key } }));
            setColorFor(null);
          }}
          onClose={() => setColorFor(null)}
        />
      ) : null}
    </View>
  );
}

/** The dashed outline where the moving tile will land. */
function Gap({ rect }: { rect: Rect }) {
  const style = useAnimatedStyle(
    () => ({
      left: withSpring(rect.x, SPRING),
      top: withSpring(rect.y, SPRING),
      width: rect.width,
      height: rect.height,
    }),
    [rect],
  );
  return <Animated.View style={[styles.gap, style]} />;
}

type GridTileProps = {
  def: TileDef;
  color: string;
  rect: Rect;
  moving: boolean;
  dragX: { value: number };
  dragY: { value: number };
  onPress?: () => void;
  onLongPress?: () => void;
};

function GridTile({
  def,
  color,
  rect,
  moving,
  dragX,
  dragY,
  onPress,
  onLongPress,
}: GridTileProps) {
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

  const style = useAnimatedStyle(() => {
    if (moving) {
      return {
        left: dragX.value,
        top: dragY.value,
        width: rect.width,
        height: rect.height,
        zIndex: 10,
        transform: [{ scale: withSpring(1.04, SPRING) }],
      };
    }
    return {
      left: withSpring(rect.x, SPRING),
      top: withSpring(rect.y, SPRING),
      width: rect.width,
      height: rect.height,
      zIndex: 0,
      transform: [{ scale: withSpring(1, SPRING) }],
    };
  }, [moving, rect]);

  return (
    <Animated.View style={[styles.tile, moving && styles.lifted, style]}>
      <Pressable
        ref={ref}
        accessibilityRole="button"
        accessibilityLabel={def.title}
        onPress={onPress ?? (() => expand(def.id))}
        onLongPress={onLongPress}
        style={({ pressed }) => [
          styles.fill,
          { backgroundColor: color, opacity: pressed && !moving ? 0.92 : 1 },
        ]}
      >
        <Tile def={def} expanded={false} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: 140 },
  content: { alignItems: "center", padding: PADDING },
  tile: { position: "absolute", borderRadius: TILE_RADIUS, overflow: "hidden" },
  lifted: {
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  fill: { flex: 1 },
  gap: {
    position: "absolute",
    borderRadius: TILE_RADIUS,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.faint,
  },
  hint: { ...type.small, marginTop: space.xl, color: colors.muted },
  editButton: {
    marginTop: space.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  editLabel: { ...type.small, color: colors.muted, fontWeight: "500" },
  pressed: { opacity: 0.7 },
});
