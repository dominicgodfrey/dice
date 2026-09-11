// The shared-element expansion primitive (PLAN.md D9, D27, D29).
//
// The grid registers a measure function per tile. An expanded tile is a
// route ("/laundry"); this component watches the pathname, measures the
// tile's rectangle, and animates a card from that rectangle to the expanded
// rectangle, cross-fading the collapsed layout into the expanded one. Swipe
// down, the scrim, Escape, or the back button navigate back, and the same
// animation runs in reverse before the card unmounts.
//
// State flows one way: route -> `active` (React state) -> `open` -> spring.
// Effects never write shared values; only worklets do.

import { usePathname, useRouter } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  type GestureType,
  type NativeGesture,
} from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import {
  expandedRect,
  TILE_RADIUS,
  WIDE_BREAKPOINT,
  type Rect,
} from "../grid/layout";
import { usePreferences } from "../preferences/store";
import {
  isTileId,
  TILE_BY_ID,
  tileColor,
  type TileId,
} from "../tiles/registry";
import { Tile } from "../tiles/Tile";

type Measure = () => Promise<Rect>;

type ExpandApi = {
  /** Called by a grid tile on mount so the overlay can find where it sits. */
  registerTile: (id: TileId, measure: Measure) => () => void;
  /** Expand a tile: navigates to its route; the overlay does the rest. */
  expand: (id: TileId) => void;
  /** Collapse whatever is expanded. */
  collapse: () => void;
};

const ExpandContext = createContext<ExpandApi | null>(null);

/**
 * What an expanded view's scroll must use so swipe-down still closes the
 * card: report its offset, and run as a native gesture the pan knows about.
 */
type ExpandedScroll = {
  onScroll: ReturnType<typeof useAnimatedScrollHandler>;
  gesture: NativeGesture;
  closePan: GestureType;
};

const ExpandedScrollContext = createContext<ExpandedScroll | null>(null);

export function useExpandedScroll(): ExpandedScroll {
  const v = useContext(ExpandedScrollContext);
  if (!v)
    throw new Error("useExpandedScroll must be used inside an expanded tile");
  return v;
}

export function useExpand(): ExpandApi {
  const api = useContext(ExpandContext);
  if (!api) throw new Error("useExpand must be used inside ExpandProvider");
  return api;
}

const SPRING = { damping: 26, stiffness: 240, mass: 1 };
const CLOSE_DISTANCE = 120;
const CLOSE_VELOCITY = 800;
const REST_THRESHOLD = 0.005;

export function ExpandProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const measures = useRef(new Map<TileId, Measure>());

  const registerTile = useCallback((id: TileId, measure: Measure) => {
    measures.current.set(id, measure);
    return () => {
      if (measures.current.get(id) === measure) measures.current.delete(id);
    };
  }, []);

  const expand = useCallback((id: TileId) => router.push(`/${id}`), [router]);

  const collapse = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }, [router]);

  const api = useMemo(
    () => ({ registerTile, expand, collapse }),
    [registerTile, expand, collapse],
  );

  return (
    <ExpandContext.Provider value={api}>
      {children}
      <Overlay measures={measures} collapse={collapse} />
    </ExpandContext.Provider>
  );
}

type Active = { id: TileId; origin: Rect };

function Overlay({
  measures,
  collapse,
}: {
  measures: RefObject<Map<TileId, Measure>>;
  collapse: () => void;
}) {
  const pathname = usePathname();
  const segment = pathname.replace(/^\//, "");
  const targetId = isTileId(segment) ? segment : null;

  const [active, setActive] = useState<Active | null>(null);
  const { prefs } = usePreferences();
  const { width: winW, height: winH } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const dest = expandedRect(winW, winH);
  const isWide = winW > WIDE_BREAKPOINT;

  const containerRef = useRef<View>(null);
  const containerOffset = useRef({ x: 0, y: 0 });

  // Route -> active. Measure where the tile sits, then mount the card there.
  const activeId = active?.id ?? null;
  useEffect(() => {
    if (!targetId || targetId === activeId) return;
    let cancelled = false;
    const measure = measures.current?.get(targetId);
    const fallback = Promise.resolve({
      x: winW / 2 - 60,
      y: winH / 2 - 60,
      width: 120,
      height: 120,
    });
    (measure ? measure() : fallback).then((r) => {
      if (cancelled) return;
      const origin = measure
        ? {
            ...r,
            x: r.x - containerOffset.current.x,
            y: r.y - containerOffset.current.y,
          }
        : r;
      setActive({ id: targetId, origin });
    });
    return () => {
      cancelled = true;
    };
  }, [targetId, activeId, measures, winW, winH]);

  // Escape closes on web.
  useEffect(() => {
    if (Platform.OS !== "web" || !activeId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") collapse();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeId, collapse]);

  // active -> open -> spring. When the closing spring lands, unmount.
  const open = activeId !== null && targetId === activeId;
  const progress = useDerivedValue(() => withSpring(open ? 1 : 0, SPRING));
  useAnimatedReaction(
    () => progress.value,
    (p, prev) => {
      // Unmount once the closing spring is at rest. Springs snap to the
      // target when they finish, but a tolerance keeps this robust if a
      // frame is dropped at the very end.
      const atRest = Math.abs(p) < REST_THRESHOLD;
      const wasMoving = prev !== null && Math.abs(prev) >= REST_THRESHOLD;
      if (!open && atRest && wasMoving) scheduleOnRN(setActive, null);
    },
    [open],
  );

  // The expanded content scrolls inside the card. The pan only takes over
  // when that scroll is at the top, so a swipe down first scrolls back up,
  // then pulls the card closed.
  const drag = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const nativeScroll = Gesture.Native();
  const pan = Gesture.Pan()
    .activeOffsetY(12)
    .simultaneousWithExternalGesture(nativeScroll)
    .onUpdate((e) => {
      if (scrollY.value > 1) return;
      drag.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      const pulled = drag.value;
      drag.value = withSpring(0, SPRING);
      if (
        pulled > CLOSE_DISTANCE ||
        (pulled > 0 && e.velocityY > CLOSE_VELOCITY)
      ) {
        scheduleOnRN(collapse);
      }
    });
  const expandedScroll = { onScroll, gesture: nativeScroll, closePan: pan };

  const origin = active?.origin ?? dest;

  const cardStyle = useAnimatedStyle(() => {
    const p = reduceMotion ? 1 : progress.value;
    const dy = drag.value;
    return {
      left: interpolate(p, [0, 1], [origin.x, dest.x]),
      top: interpolate(p, [0, 1], [origin.y, dest.y]),
      width: interpolate(p, [0, 1], [origin.width, dest.width]),
      height: interpolate(p, [0, 1], [origin.height, dest.height]),
      borderRadius: interpolate(p, [0, 1], [TILE_RADIUS, isWide ? 24 : 0]),
      opacity: reduceMotion ? progress.value : 1,
      transform: [
        { translateY: dy },
        { scale: interpolate(dy, [0, winH], [1, 0.75], Extrapolation.CLAMP) },
      ],
    };
  }, [origin, dest, isWide, reduceMotion, winH]);

  const collapsedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.35],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));
  const expandedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0.3, 0.75],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));
  const scrimStyle = useAnimatedStyle(() => ({
    opacity:
      interpolate(progress.value, [0, 1], [0, 0.45]) *
      interpolate(drag.value, [0, winH / 2], [1, 0], Extrapolation.CLAMP),
  }));

  const def = active ? TILE_BY_ID.get(active.id) : undefined;

  return (
    <View
      ref={containerRef}
      pointerEvents={active ? "auto" : "none"}
      style={StyleSheet.absoluteFill}
      onLayout={() => {
        containerRef.current?.measureInWindow((x, y) => {
          containerOffset.current = { x, y };
        });
      }}
    >
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={collapse}
          accessibilityLabel="Close"
        />
      </Animated.View>
      {active && def ? (
        <GestureDetector gesture={pan}>
          <Animated.View
            style={[
              styles.card,
              { backgroundColor: tileColor(prefs, def) },
              cardStyle,
            ]}
          >
            <Animated.View
              style={[
                styles.layer,
                { width: origin.width, height: origin.height },
                collapsedStyle,
              ]}
            >
              <Tile def={def} expanded={false} />
            </Animated.View>
            <Animated.View
              style={[
                styles.layer,
                { width: dest.width, height: dest.height },
                expandedStyle,
              ]}
            >
              <ExpandedScrollContext.Provider value={expandedScroll}>
                <Tile def={def} expanded />
              </ExpandedScrollContext.Provider>
            </Animated.View>
          </Animated.View>
        </GestureDetector>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { backgroundColor: "#000000" },
  card: { position: "absolute", overflow: "hidden" },
  layer: { position: "absolute", left: 0, top: 0 },
});
