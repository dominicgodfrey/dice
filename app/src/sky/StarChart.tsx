// The star chart (PLAN.md D38): stars sized by brightness, constellation
// figures, the moon and planets, a compass rim. Rotates to a heading when
// the phone's compass is on.

import { View } from "react-native";
import Svg, { Circle, G, Line, Text as SvgText } from "react-native-svg";
import { colors, font } from "../ui/theme";
import { NAMED } from "./catalog";
import { starRadius, toDisc, type Chart } from "./chart";

type Props = {
  chart: Chart;
  size: number;
  heading?: number;
  labels?: boolean;
  compact?: boolean;
};

const LINE = "rgba(255,255,255,0.28)";
const RIM = "rgba(255,255,255,0.35)";

export function StarChart({
  chart,
  size,
  heading = 0,
  labels = true,
  compact = false,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - (compact ? 2 : 14);
  const at = (alt: number, az: number) => {
    const d = toDisc(alt, az, heading);
    return { x: cx + d.x * R, y: cy + d.y * R };
  };
  const scale = compact ? 0.55 : 1;
  const points = ["N", "E", "S", "W"] as const;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={cx}
          cy={cy}
          r={R}
          fill="rgba(0,0,0,0.25)"
          stroke={RIM}
          strokeWidth={1}
        />
        {!compact ? (
          <Circle
            cx={cx}
            cy={cy}
            r={R / 2}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={1}
            strokeDasharray="3 4"
          />
        ) : null}
        <G>
          {chart.lines.map((l, i) => {
            const a = at(l.from.alt, l.from.az);
            const b = at(l.to.alt, l.to.az);
            return (
              <Line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={LINE}
                strokeWidth={compact ? 0.8 : 1}
              />
            );
          })}
        </G>
        <G>
          {chart.stars.map((s) => {
            if (s.alt < 0) return null;
            const p = at(s.alt, s.az);
            return (
              <Circle
                key={s.id}
                cx={p.x}
                cy={p.y}
                r={starRadius(s.mag, scale)}
                fill={colors.onDark}
                opacity={s.mag > 3.5 ? 0.6 : 1}
              />
            );
          })}
        </G>
        <G>
          {chart.bodies.map((b) => {
            if (b.alt < 0) return null;
            const p = at(b.alt, b.az);
            const sun = b.id === "sun";
            const moon = b.id === "moon";
            const r = (sun ? 6 : moon ? 5 : 3) * scale;
            return (
              <G key={b.id}>
                <Circle
                  cx={p.x}
                  cy={p.y}
                  r={r + 2 * scale}
                  fill="none"
                  stroke={sun ? "#FFD166" : "#BFE0FF"}
                  strokeWidth={1}
                  opacity={0.7}
                />
                <Circle
                  cx={p.x}
                  cy={p.y}
                  r={r}
                  fill={sun ? "#FFD166" : moon ? "#F1F1F1" : "#BFE0FF"}
                />
                {labels ? (
                  <SvgText
                    x={p.x + r + 4}
                    y={p.y + 4}
                    fill={colors.onDark}
                    fontSize={11}
                    fontFamily={font.medium}
                  >
                    {b.name}
                  </SvgText>
                ) : null}
              </G>
            );
          })}
        </G>
        {labels ? (
          <G>
            {chart.constellations
              .filter((c) => c.visible / c.total >= 0.5 && c.alt > 12)
              .map((c) => {
                const p = at(c.alt, c.az);
                return (
                  <SvgText
                    key={c.abbr}
                    x={p.x}
                    y={p.y}
                    fill="rgba(255,255,255,0.75)"
                    fontSize={11}
                    fontFamily={font.regular}
                    textAnchor="middle"
                  >
                    {c.name}
                  </SvgText>
                );
              })}
            {chart.stars
              .filter((s) => NAMED[s.id] && s.alt > 5)
              .map((s) => {
                const p = at(s.alt, s.az);
                return (
                  <SvgText
                    key={`${s.id}-n`}
                    x={p.x + 5}
                    y={p.y - 5}
                    fill="rgba(255,255,255,0.6)"
                    fontSize={9}
                    fontFamily={font.regular}
                  >
                    {NAMED[s.id]}
                  </SvgText>
                );
              })}
          </G>
        ) : null}
        {!compact ? (
          <G>
            {points.map((p, i) => {
              const az = i * 90;
              const d = toDisc(-6, az, heading);
              return (
                <SvgText
                  key={p}
                  x={cx + d.x * R}
                  y={cy + d.y * R + 4}
                  fill={colors.onDarkMuted}
                  fontSize={11}
                  fontFamily={font.semibold}
                  textAnchor="middle"
                >
                  {p}
                </SvgText>
              );
            })}
          </G>
        ) : null}
      </Svg>
    </View>
  );
}
