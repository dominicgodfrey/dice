// The header's time-of-day line: a low arch from rise to set with the sun
// or moon at "now". Labels at the ends carry the times.

import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { arcAt, bezierPoint } from "../sky/arc";
import { Text } from "../ui/Text";
import { type } from "../ui/theme";

const HEIGHT = 44;
const PAD = 6;

function formatTime(d: Date): string {
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function DayArc({
  now,
  label,
  fg,
  dim,
}: {
  now: Date;
  /** The sky's name for this moment: "Day", "Golden hour", "Night". */
  label: string;
  fg: string;
  dim: string;
}) {
  const [width, setWidth] = useState(0);
  const arc = arcAt(now);
  const p0: [number, number] = [PAD, HEIGHT - PAD];
  const p2: [number, number] = [width - PAD, HEIGHT - PAD];
  const c: [number, number] = [width / 2, -HEIGHT * 0.55];
  const [x, y] = arc ? bezierPoint(p0, c, p2, arc.t) : [0, 0];
  const d = `M ${p0[0]} ${p0[1]} Q ${c[0]} ${c[1]} ${p2[0]} ${p2[1]}`;
  return (
    <View style={styles.wrap}>
      <View
        style={styles.line}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      >
        {width > 0 && arc ? (
          <Svg width={width} height={HEIGHT}>
            <Path
              d={d}
              stroke={dim}
              strokeWidth={1.5}
              fill="none"
              opacity={0.55}
            />
            {arc.body === "none" ? (
              <Circle
                cx={x}
                cy={y}
                r={4}
                stroke={fg}
                strokeWidth={1.5}
                fill="none"
              />
            ) : (
              <Circle cx={x} cy={y} r={arc.body === "sun" ? 6 : 5} fill={fg} />
            )}
          </Svg>
        ) : null}
      </View>
      <View style={styles.labels}>
        <Text style={[styles.label, { color: dim }]} numberOfLines={1}>
          {arc ? `${arc.startLabel} ${formatTime(arc.start)}` : ""}
        </Text>
        <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.label, { color: dim }]} numberOfLines={1}>
          {arc ? `${arc.endLabel} ${formatTime(arc.end)}` : ""}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 10 },
  line: { width: "100%", height: HEIGHT },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  label: { ...type.small },
});
