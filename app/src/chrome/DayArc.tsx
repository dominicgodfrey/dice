// The header's time-of-day line: a low arch from rise to set with the sun
// or moon at "now". At each foot of the arch, an icon for what rises or
// sets there and the time it does.

import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { arcAt, type DayArc as Arc } from "../sky/arc";
import { bezierPoint } from "../sky/arc";
import { Icon, type IconName } from "../ui/Icon";
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

/** The icons at the two feet: what rises on the left, what sets on the right. */
function feet(arc: Arc): [IconName, IconName] {
  switch (arc.body) {
    case "sun":
      return ["sunrise", "sunset"];
    case "moon":
      return ["moon", "moon"];
    case "none":
      return ["sunset", "sunrise"];
  }
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
  const [left, right]: [IconName, IconName] = arc
    ? feet(arc)
    : ["sunrise", "sunset"];
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
      <View style={styles.feet}>
        <View style={styles.foot}>
          <Icon name={left} size={16} color={fg} />
          <Text style={[styles.label, { color: dim }]} numberOfLines={1}>
            {arc ? formatTime(arc.start) : ""}
          </Text>
        </View>
        <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
          {label}
        </Text>
        <View style={styles.foot}>
          <Text style={[styles.label, { color: dim }]} numberOfLines={1}>
            {arc ? formatTime(arc.end) : ""}
          </Text>
          <Icon name={right} size={16} color={fg} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 10 },
  line: { width: "100%", height: HEIGHT },
  feet: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: -2,
  },
  foot: { flexDirection: "row", alignItems: "center", gap: 6 },
  label: { ...type.small },
});
