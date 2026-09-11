// The campus map (PLAN.md D39, D41): aerial imagery with names, entrances,
// rooms and photo checkpoints drawn over it; pinch to zoom, drag to pan.
// Zooming in reveals more.

import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
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
import { detailLevel, fit, IMAGERY, onImage } from "./campus";

type Props = {
  data: CampusData;
  width: number;
  height: number;
  /** Static: no gestures, no labels. */
  compact?: boolean;
  /** A gesture the map's own gestures should win over (the card's swipe-to-close). */
  blocks?: GestureType;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
const HALO = "rgba(10,14,25,0.85)";

/** Text with a dark halo so it reads over imagery. */
function Label({
  x,
  y,
  size,
  children,
  anchor = "middle",
  color = colors.onDark,
  family = font.medium,
}: {
  x: number;
  y: number;
  size: number;
  children: string;
  anchor?: "start" | "middle" | "end";
  color?: string;
  family?: string;
}) {
  return (
    <G>
      <SvgText
        x={x}
        y={y}
        fill={HALO}
        stroke={HALO}
        strokeWidth={3}
        fontSize={size}
        fontFamily={family}
        textAnchor={anchor}
      >
        {children}
      </SvgText>
      <SvgText
        x={x}
        y={y}
        fill={color}
        fontSize={size}
        fontFamily={family}
        textAnchor={anchor}
      >
        {children}
      </SvgText>
    </G>
  );
}

export function CampusMap({
  data,
  width,
  height,
  compact = false,
  blocks,
}: Props) {
  const f = fit(width, height);
  const [level, setLevel] = useState<1 | 2 | 3>(1);

  const zoom = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const startZoom = useSharedValue(1);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
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

  const buildings = onImage(data, f);
  const labelSize = Math.max(7, 11 / Math.max(1, level - 0.4));
  const content = (
    <View style={{ width, height }}>
      <Image
        source={require("../../assets/map/campus.jpg")}
        style={{
          position: "absolute",
          left: f.image.x,
          top: f.image.y,
          width: f.image.w,
          height: f.image.h,
        }}
        resizeMode="stretch"
        accessibilityLabel="Aerial view of campus"
      />
      {!compact ? (
        <Svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={StyleSheet.absoluteFill}
        >
          <G>
            {buildings
              .filter((b) => level >= 2 || Math.max(b.w, b.h) >= 50)
              .map((b) => {
                const c = f.project(b.lat, b.lon);
                return (
                  <Label
                    key={b.id}
                    x={c.x}
                    y={c.y + labelSize / 3}
                    size={labelSize}
                  >
                    {b.name}
                  </Label>
                );
              })}
            {data.places
              .filter((p) => f.contains(p.lat, p.lon))
              .map((p) => {
                const c = f.project(p.lat, p.lon);
                return (
                  <G key={p.id}>
                    <Circle
                      cx={c.x}
                      cy={c.y}
                      r={2.5}
                      fill={colors.onDark}
                      stroke={HALO}
                      strokeWidth={1}
                    />
                    {level >= 2 ? (
                      <Label
                        x={c.x + 5}
                        y={c.y + 3}
                        size={labelSize * 0.9}
                        anchor="start"
                        family={font.regular}
                      >
                        {p.name}
                      </Label>
                    ) : null}
                  </G>
                );
              })}
            {level >= 2
              ? buildings.flatMap((b) =>
                  b.entrances.map((e, i) => {
                    const c = f.project(e.lat, e.lon);
                    return (
                      <G key={`${b.id}-e${i}`}>
                        <Circle
                          cx={c.x}
                          cy={c.y}
                          r={2.2}
                          fill="#FFD166"
                          stroke={HALO}
                          strokeWidth={1}
                        />
                        {level >= 3 ? (
                          <Label
                            x={c.x + 4}
                            y={c.y + 2.5}
                            size={labelSize * 0.75}
                            anchor="start"
                            color="#FFD166"
                            family={font.regular}
                          >
                            {e.label}
                          </Label>
                        ) : null}
                      </G>
                    );
                  }),
                )
              : null}
            {level >= 3
              ? buildings.flatMap((b) =>
                  b.rooms.map((r, i) => {
                    const c = f.project(r.lat, r.lon);
                    return (
                      <G key={`${b.id}-r${i}`}>
                        <Rect
                          x={c.x - 2}
                          y={c.y - 2}
                          width={4}
                          height={4}
                          fill="#BFE0FF"
                          stroke={HALO}
                          strokeWidth={1}
                        />
                        <Label
                          x={c.x + 4}
                          y={c.y + 2.5}
                          size={labelSize * 0.75}
                          anchor="start"
                          color="#BFE0FF"
                          family={font.regular}
                        >
                          {r.label}
                        </Label>
                      </G>
                    );
                  }),
                )
              : null}
            {level >= 3
              ? data.photos.map((p) => {
                  const c = f.project(p.lat, p.lon);
                  return (
                    <Circle
                      key={p.id}
                      cx={c.x}
                      cy={c.y}
                      r={3.5}
                      fill="#F1F1F1"
                      stroke="#1C2333"
                      strokeWidth={1.2}
                    />
                  );
                })
              : null}
          </G>
          <Label
            x={width - 6}
            y={height - 6}
            size={8}
            anchor="end"
            color={colors.onDarkMuted}
            family={font.regular}
          >
            {IMAGERY.attribution}
          </Label>
        </Svg>
      ) : null}
    </View>
  );

  if (compact) return <View style={styles.compact}>{content}</View>;
  return (
    <GestureDetector gesture={gesture}>
      <View style={[styles.viewport, { width, height }]}>
        <Animated.View style={style}>{content}</Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  viewport: {
    overflow: "hidden",
    borderRadius: 12,
    backgroundColor: "#0A0E19",
  },
  compact: { overflow: "hidden", borderRadius: 10 },
});
