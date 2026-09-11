// BranVan tile (PLAN.md D18): the home stop's next arrival collapsed;
// routes, arrivals per stop and a map expanded. The home stop is asked for
// on the first expand and is a preference. Data is the fixture until
// Transportation shares the GTFS-RT feed (section 2).

import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Polyline, Text as SvgText } from "react-native-svg";
import { usePreferences } from "../../preferences/store";
import { originLabel, useSources } from "../../sources/SourcesProvider";
import type { ShuttleData, ShuttleStop } from "../../sources/types";
import {
  CollapsedShell,
  ExpandedShell,
  Row,
  Section,
  shellStyles,
} from "../shells";
import { arrivalsAt, minutesLabel, project, stopsOnRoute } from "./shuttle";

function useHomeStop(): ShuttleStop | null {
  const { shuttle } = useSources();
  const { prefs } = usePreferences();
  return shuttle.data.stops.find((s) => s.id === prefs.homeStop) ?? null;
}

export function BranVanCollapsed() {
  const { shuttle } = useSources();
  const stop = useHomeStop();
  if (!stop) {
    return (
      <CollapsedShell title="BranVan">
        <Text style={[shellStyles.line, styles.white]}>Pick your stop</Text>
      </CollapsedShell>
    );
  }
  const next = arrivalsAt(shuttle.data, stop.id)[0];
  return (
    <CollapsedShell title="BranVan">
      <Text style={[shellStyles.big, styles.white]}>
        {next ? minutesLabel(next.minutes) : "—"}
      </Text>
      <Text style={[shellStyles.small, styles.dim]} numberOfLines={1}>
        {next ? next.routeName : "No arrivals"}
      </Text>
      <Text style={[shellStyles.small, styles.dim]} numberOfLines={1}>
        {stop.name}
      </Text>
    </CollapsedShell>
  );
}

export function BranVanExpanded() {
  const { shuttle } = useSources();
  const { update } = usePreferences();
  const home = useHomeStop();
  const [routeId, setRouteId] = useState(shuttle.data.routes[0]?.id ?? "");

  if (!home) {
    return (
      <ExpandedShell title="BranVan" subtitle="Which stop is closest to you?">
        {shuttle.data.stops.map((s) => (
          <Pressable
            key={s.id}
            accessibilityRole="button"
            onPress={() => update({ homeStop: s.id })}
            style={({ pressed }) => [styles.choice, pressed && styles.pressed]}
          >
            <Text style={[shellStyles.line, styles.white, styles.bold]}>
              {s.name}
            </Text>
          </Pressable>
        ))}
      </ExpandedShell>
    );
  }

  const route =
    shuttle.data.routes.find((r) => r.id === routeId) ?? shuttle.data.routes[0];
  return (
    <ExpandedShell title="BranVan" subtitle={originLabel(shuttle)}>
      <Section title={home.name}>
        {arrivalsAt(shuttle.data, home.id)
          .slice(0, 5)
          .map((a, i) => (
            <Row
              key={i}
              left={a.routeName}
              right={minutesLabel(a.minutes)}
              strong={i === 0}
            />
          ))}
        <Pressable
          accessibilityRole="button"
          onPress={() => update({ homeStop: null })}
          style={({ pressed }) => [styles.change, pressed && styles.pressed]}
        >
          <Text style={[shellStyles.small, styles.white, styles.bold]}>
            Change stop
          </Text>
        </Pressable>
      </Section>

      <Section title="Routes">
        <View style={styles.tabs}>
          {shuttle.data.routes.map((r) => (
            <Pressable
              key={r.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: r.id === route?.id }}
              onPress={() => setRouteId(r.id)}
              style={({ pressed }) => [
                styles.tab,
                r.id === route?.id && styles.tabOn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[shellStyles.small, styles.white, styles.bold]}>
                {r.name}
              </Text>
            </Pressable>
          ))}
        </View>
        {route ? (
          <RouteMap data={shuttle.data} routeId={route.id} homeId={home.id} />
        ) : null}
        {route
          ? stopsOnRoute(shuttle.data, route.id).map((s) => {
              const next = arrivalsAt(shuttle.data, s.id).find(
                (a) => a.routeId === route.id,
              );
              return (
                <Row
                  key={s.id}
                  left={s.name}
                  right={next ? minutesLabel(next.minutes) : "—"}
                  strong={s.id === home.id}
                />
              );
            })
          : null}
      </Section>
    </ExpandedShell>
  );
}

const MAP_W = 320;
const MAP_H = 200;

function RouteMap({
  data,
  routeId,
  homeId,
}: {
  data: ShuttleData;
  routeId: string;
  homeId: string;
}) {
  const stops = stopsOnRoute(data, routeId);
  const route = data.routes.find((r) => r.id === routeId);
  const points = project(stops, MAP_W, MAP_H, 28);
  const line = stops
    .map((s) => points.get(s.id))
    .filter((p): p is { x: number; y: number } => Boolean(p))
    .map((p) => `${p.x},${p.y}`)
    .join(" ");
  return (
    <View style={styles.map}>
      <Svg width="100%" height={MAP_H} viewBox={`0 0 ${MAP_W} ${MAP_H}`}>
        <Polyline
          points={line}
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth={3}
        />
        {stops.map((s) => {
          const p = points.get(s.id);
          if (!p) return null;
          const isHome = s.id === homeId;
          return (
            <Circle
              key={s.id}
              cx={p.x}
              cy={p.y}
              r={isHome ? 8 : 5}
              fill={isHome ? "#ffffff" : (route?.color ?? "#ffffff")}
              stroke="#ffffff"
              strokeWidth={2}
            />
          );
        })}
        {stops.map((s) => {
          const p = points.get(s.id);
          if (!p) return null;
          return (
            <SvgText
              key={`${s.id}-label`}
              x={p.x + 10}
              y={p.y - 8}
              fill="#ffffff"
              fontSize={11}
              fontWeight={s.id === homeId ? "700" : "400"}
            >
              {s.name}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  white: { color: "#ffffff" },
  dim: { color: "rgba(255,255,255,0.8)" },
  bold: { fontWeight: "700" },
  choice: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.25)",
  },
  change: {
    marginTop: 12,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  tabs: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  tabOn: { backgroundColor: "rgba(255,255,255,0.35)" },
  map: {
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.15)",
    marginBottom: 12,
    overflow: "hidden",
  },
  pressed: { opacity: 0.7 },
});
