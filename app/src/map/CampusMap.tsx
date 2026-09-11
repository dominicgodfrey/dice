// The stylised campus map (PLAN.md D39): buildings as blocks, paths as
// labels, pinch to zoom and drag to pan. Zooming in reveals entrances, then
// rooms and photo checkpoints. Everything is SVG drawn from the fixture.

import { useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  type GestureType,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import Svg, { Circle, G, Rect, Text as SvgText } from "react-native-svg";
import type { CampusData } from "../sources/types";
import { colors, font } from "../ui/theme";
import { detailLevel, fit } from "./campus";

const KIND_FILL: Record<string, string> = {
  academic: "rgba(255,255,255,0.22)",
  residence: "rgba(255,255,255,0.14)",
  dining: "rgba(255,210,140,0.35)",
  library: "rgba(191,224,255,0.35)",
  athletics: "rgba(160,230,190,0.3)",
  student: "rgba(255,255,255,0.3)",
  arts: "rgba(230,190,255,0.3)",
  admin: "rgba(255,255,255,0.12)",
  other: "rgba(255,255,255,0.12)",
};

type Props = {
  data: CampusData;
  width: number;
  height: number;
  /** Static: no gestures, no labels below level 1. */
  compact?: boolean;
  /** A gesture the map's own gestures should win over (the card's swipe-to-close). */
  blocks?: GestureType;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;

export function CampusMap({
  data,
  width,
  height,
  compact = false,
  blocks,
}: Props) {
  const { pxPerM, project } = fit(data, width, height);
  const [level, setLevel] = useState<1 | 2 | 3>(1);

  const zoom = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const startZoom = useSharedValue(1);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // Detail follows zoom in discrete steps; tell React only when it changes.
  const lastLevel = useSharedValue<1 | 2 | 3>(1);
  const noteZoom = (z: number) => {
    "worklet";
    const lvl = detailLevel(z);
    if (lvl !== lastLevel.value) {
      lastLevel.value = lvl;
      scheduleOnRN(setLevel, lvl);
    }
  };

  const clamp = (v: number, lo: number, hi: number) => {
    "worklet";
    return Math.min(hi, Math.max(lo, v));
  };

  let pinch = Gesture.Pinch()
    .onStart(() => {
      startZoom.value = zoom.value;
    })
    .onUpdate((e) => {
      zoom.value = clamp(startZoom.value * e.scale, MIN_ZOOM, MAX_ZOOM);
      noteZoom(zoom.value);
    });
  let pan = Gesture.Pan()
    .minDistance(2)
    .onStart(() => {
      startX.value = tx.value;
      startY.value = ty.value;
    })
    .onUpdate((e) => {
      const limitX = (width * (zoom.value - 1)) / 2;
      const limitY = (height * (zoom.value - 1)) / 2;
      tx.value = clamp(startX.value + e.translationX, -limitX, limitX);
      ty.value = clamp(startY.value + e.translationY, -limitY, limitY);
    });
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const next = zoom.value >= 3 ? 1 : zoom.value >= 1.7 ? 3.2 : 1.9;
      zoom.value = withSpring(next, { damping: 20, stiffness: 180 });
      noteZoom(next);
      if (next === 1) {
        tx.value = withSpring(0);
        ty.value = withSpring(0);
      }
    });
  if (blocks) {
    pinch = pinch.blocksExternalGesture(blocks);
    pan = pan.blocksExternalGesture(blocks);
  }
  const gesture = Gesture.Simultaneous(pinch, pan, doubleTap);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: zoom.value },
    ],
  }));

  const labelSize = compact ? 0 : Math.max(8, 11 / Math.max(1, level - 0.5));
  const svg = (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Rect x={0} y={0} width={width} height={height} fill="rgba(0,0,0,0.18)" />
      <G>
        {data.buildings.map((b) => {
          const c = project(b.lat, b.lon);
          const w = b.w * pxPerM;
          const h = b.h * pxPerM;
          return (
            <G key={b.id} transform={`rotate(${b.rot} ${c.x} ${c.y})`}>
              <Rect
                x={c.x - w / 2}
                y={c.y - h / 2}
                width={w}
                height={h}
                rx={Math.min(4, w / 6)}
                fill={KIND_FILL[b.kind] ?? KIND_FILL.other}
                stroke="rgba(255,255,255,0.45)"
                strokeWidth={0.8}
              />
            </G>
          );
        })}
      </G>
      {!compact ? (
        <G>
          {data.buildings
            .filter((b) => level >= 2 || Math.max(b.w, b.h) >= 50)
            .map((b) => {
              const c = project(b.lat, b.lon);
              return (
                <SvgText
                  key={`${b.id}-l`}
                  x={c.x}
                  y={c.y + labelSize / 3}
                  fill={colors.onDark}
                  fontSize={labelSize}
                  fontFamily={font.medium}
                  textAnchor="middle"
                >
                  {b.name}
                </SvgText>
              );
            })}
          {data.places.map((p) => {
            const c = project(p.lat, p.lon);
            return (
              <G key={p.id}>
                <Circle cx={c.x} cy={c.y} r={2.5} fill={colors.onDarkMuted} />
                {level >= 2 ? (
                  <SvgText
                    x={c.x + 5}
                    y={c.y + 3}
                    fill={colors.onDarkMuted}
                    fontSize={labelSize * 0.9}
                    fontFamily={font.regular}
                  >
                    {p.name}
                  </SvgText>
                ) : null}
              </G>
            );
          })}
          {level >= 2
            ? data.buildings.flatMap((b) =>
                b.entrances.map((e, i) => {
                  const c = project(e.lat, e.lon);
                  return (
                    <G key={`${b.id}-e${i}`}>
                      <Circle cx={c.x} cy={c.y} r={2.2} fill="#FFD166" />
                      {level >= 3 ? (
                        <SvgText
                          x={c.x + 4}
                          y={c.y + 2.5}
                          fill="#FFD166"
                          fontSize={labelSize * 0.75}
                          fontFamily={font.regular}
                        >
                          {e.label}
                        </SvgText>
                      ) : null}
                    </G>
                  );
                }),
              )
            : null}
          {level >= 3
            ? data.buildings.flatMap((b) =>
                b.rooms.map((r, i) => {
                  const c = project(r.lat, r.lon);
                  return (
                    <G key={`${b.id}-r${i}`}>
                      <Rect
                        x={c.x - 2}
                        y={c.y - 2}
                        width={4}
                        height={4}
                        fill="#BFE0FF"
                      />
                      <SvgText
                        x={c.x + 4}
                        y={c.y + 2.5}
                        fill="#BFE0FF"
                        fontSize={labelSize * 0.75}
                        fontFamily={font.regular}
                      >
                        {r.label}
                      </SvgText>
                    </G>
                  );
                }),
              )
            : null}
          {level >= 3
            ? data.photos.map((p) => {
                const c = project(p.lat, p.lon);
                return (
                  <Circle
                    key={p.id}
                    cx={c.x}
                    cy={c.y}
                    r={3}
                    fill="#F1F1F1"
                    stroke="#1C2333"
                    strokeWidth={1}
                  />
                );
              })
            : null}
        </G>
      ) : null}
    </Svg>
  );

  if (compact) return <View style={{ width, height }}>{svg}</View>;
  return (
    <GestureDetector gesture={gesture}>
      <View style={[styles.viewport, { width, height }]}>
        <Animated.View style={style}>{svg}</Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  viewport: { overflow: "hidden", borderRadius: 12 },
});
