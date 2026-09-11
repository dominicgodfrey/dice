// Sky tile (PLAN.md D17): sunset and what is up now collapsed; a static
// dome with moon and planets expanded (layer 2); "point your phone" behind
// a button for the orientation view (layer 3).

import { StyleSheet, Text, View, Pressable } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";
import {
  aboveHorizon,
  bodiesAt,
  compassPoint,
  moonPhase,
  type Body,
} from "../../sky/bodies";
import { skyFor, sunAltitude, sunTimes } from "../../sky/sun";
import { useHeading } from "../../sky/useHeading";
import { formatClock } from "../../util/time";
import { useNow } from "../../util/useNow";
import {
  CollapsedShell,
  ExpandedShell,
  Row,
  Section,
  shellStyles,
} from "../shells";

export function SkyCollapsed() {
  const now = useNow();
  const { sunrise, sunset } = sunTimes(now);
  const sky = skyFor(sunAltitude(now));
  const up = aboveHorizon(bodiesAt(now)).filter((b) => b.id !== "sun");
  const moon = moonPhase(now);
  const isDay = sunAltitude(now) > 0;
  return (
    <CollapsedShell title="Sky">
      <Text style={[shellStyles.big, styles.white]}>
        {isDay
          ? `Sunset ${formatClock(sunset ?? now)}`
          : `Sunrise ${formatClock(sunrise ?? now)}`}
      </Text>
      <Text style={[shellStyles.small, styles.dim]}>
        {sky.label} · {moon.name}
      </Text>
      <Text style={[shellStyles.small, styles.dim]} numberOfLines={2}>
        {up.length
          ? `Up now: ${up.map((b) => b.name).join(", ")}`
          : "Nothing up but the sun"}
      </Text>
    </CollapsedShell>
  );
}

export function SkyExpanded() {
  const now = useNow(30_000);
  const bodies = bodiesAt(now);
  const up = aboveHorizon(bodies);
  const moon = moonPhase(now);
  const { sunrise, sunset } = sunTimes(now);
  const heading = useHeading();

  return (
    <ExpandedShell
      title="Sky"
      subtitle={`${skyFor(sunAltitude(now)).label} over campus`}
    >
      <Dome bodies={up} />
      <Section title="Up now">
        {up.length === 0 ? (
          <Text style={[shellStyles.line, styles.white]}>
            Nothing above the horizon.
          </Text>
        ) : null}
        {up.map((b) => (
          <Row
            key={b.id}
            left={b.name}
            right={`${compassPoint(b.azimuth)} · ${Math.round(b.altitude)}° up`}
            strong={b.id === "moon"}
          />
        ))}
      </Section>
      <Section title="Today">
        <Row left="Sunrise" right={sunrise ? formatClock(sunrise) : "—"} />
        <Row left="Sunset" right={sunset ? formatClock(sunset) : "—"} />
        <Row
          left="Moon"
          right={`${moon.name}, ${Math.round(moon.fraction * 100)}% lit`}
        />
      </Section>
      <Section title="Point your phone">
        {heading.state.status === "on" ? (
          <Pointing
            heading={heading.state.heading}
            bodies={up}
            onStop={heading.stop}
          />
        ) : (
          <View>
            <Text style={[shellStyles.small, styles.dim, styles.note]}>
              Uses your phone&apos;s compass to show what is in the direction
              you are facing. Nothing leaves the phone.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={heading.start}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[shellStyles.line, styles.white, styles.bold]}>
                {heading.state.status === "asking" ? "Asking…" : "Start"}
              </Text>
            </Pressable>
            {heading.state.status === "denied" ? (
              <Text style={[shellStyles.small, styles.dim, styles.note]}>
                {heading.state.reason}
              </Text>
            ) : null}
          </View>
        )}
      </Section>
    </ExpandedShell>
  );
}

const W = 320;
const H = 170;
const R = 140;
const CX = W / 2;
const CY = H - 12;

/** A static half-dome: azimuth left to right (S at centre), altitude up. */
function Dome({ bodies }: { bodies: Body[] }) {
  const pos = (b: Body) => {
    // Unroll the sky: azimuth 0..360 across the width with south centred,
    // altitude along the radius.
    const a = (((b.azimuth - 180 + 540) % 360) - 180) / 180; // -1..1, south = 0
    const theta = Math.PI / 2 - (a * Math.PI) / 2; // 0..pi, left = east
    const r = R * (1 - b.altitude / 90);
    return { x: CX + r * Math.cos(theta), y: CY - r * Math.sin(theta) };
  };
  return (
    <View style={styles.dome}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
          fill="rgba(255,255,255,0.06)"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={1.5}
        />
        <Line
          x1={CX - R}
          y1={CY}
          x2={CX + R}
          y2={CY}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={1.5}
        />
        <Path
          d={`M ${CX - R * 0.5} ${CY} A ${R * 0.5} ${R * 0.5} 0 0 1 ${CX + R * 0.5} ${CY}`}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
        <SvgText
          x={CX - R}
          y={CY + 11}
          fill="rgba(255,255,255,0.7)"
          fontSize={10}
        >
          E
        </SvgText>
        <SvgText
          x={CX - 4}
          y={CY - R - 4}
          fill="rgba(255,255,255,0.7)"
          fontSize={10}
        >
          S
        </SvgText>
        <SvgText
          x={CX + R - 8}
          y={CY + 11}
          fill="rgba(255,255,255,0.7)"
          fontSize={10}
        >
          W
        </SvgText>
        {bodies.map((b) => {
          const p = pos(b);
          const r = b.id === "sun" ? 9 : b.id === "moon" ? 7 : 4;
          const fill =
            b.id === "sun"
              ? "#FFD166"
              : b.id === "moon"
                ? "#F1F1F1"
                : "#BFE0FF";
          return <Circle key={b.id} cx={p.x} cy={p.y} r={r} fill={fill} />;
        })}
        {bodies.map((b) => {
          const p = pos(b);
          return (
            <SvgText
              key={`${b.id}-l`}
              x={p.x + 9}
              y={p.y + 4}
              fill="#ffffff"
              fontSize={11}
            >
              {b.name}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

/** Layer 3: bodies within 45° of where the phone points. */
function Pointing({
  heading,
  bodies,
  onStop,
}: {
  heading: number;
  bodies: Body[];
  onStop: () => void;
}) {
  const near = bodies
    .map((b) => ({ b, delta: ((b.azimuth - heading + 540) % 360) - 180 }))
    .filter(({ delta }) => Math.abs(delta) <= 45)
    .sort((x, y) => Math.abs(x.delta) - Math.abs(y.delta));
  return (
    <View>
      <Text style={[shellStyles.big, styles.white]}>
        {compassPoint(heading)} · {Math.round(heading)}°
      </Text>
      {near.length === 0 ? (
        <Text style={[shellStyles.small, styles.dim, styles.note]}>
          Nothing that way right now. Turn slowly.
        </Text>
      ) : (
        near.map(({ b, delta }) => (
          <Row
            key={b.id}
            left={b.name}
            right={`${Math.abs(delta) < 8 ? "ahead" : delta < 0 ? `${Math.round(-delta)}° left` : `${Math.round(delta)}° right`} · ${Math.round(b.altitude)}° up`}
            strong={Math.abs(delta) < 8}
          />
        ))
      )}
      <Pressable
        accessibilityRole="button"
        onPress={onStop}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={[shellStyles.small, styles.white, styles.bold]}>Stop</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  white: { color: "#ffffff" },
  dim: { color: "rgba(255,255,255,0.8)" },
  bold: { fontWeight: "700" },
  note: { marginBottom: 10 },
  dome: {
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.2)",
    overflow: "hidden",
  },
  button: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  pressed: { opacity: 0.7 },
});
