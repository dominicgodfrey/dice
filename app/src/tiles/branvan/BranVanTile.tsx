// BranVan tile (PLAN.md D18): the home stop's route as a line with the vans
// on it, collapsed; routes, arrivals per stop and a map with vans expanded.
// The home stop is asked for on the first expand and is a preference. Data
// is the fixture until Transportation shares the GTFS-RT feed (section 2).

import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, {
  Circle,
  Line,
  Polyline,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import { usePreferences } from "../../preferences/store";
import { originLabel, useSources } from "../../sources/SourcesProvider";
import type { ShuttleData, ShuttleStop } from "../../sources/types";
import { Text } from "../../ui/Text";
import { colors, font, space } from "../../ui/theme";
import {
  CollapsedShell,
  ExpandedShell,
  Row,
  Section,
  t,
  TileButton,
} from "../shells";
import {
  alongRoute,
  arrivalsAt,
  minutesLabel,
  project,
  routeServing,
  stopsOnRoute,
} from "./shuttle";

function useHomeStop(): ShuttleStop | null {
  const { shuttle } = useSources();
  const { prefs } = usePreferences();
  return shuttle.data.stops.find((s) => s.id === prefs.homeStop) ?? null;
}

/** A horizontal strip: the route as a line, stops as ticks, vans as markers. */
function RouteStrip({
  data,
  routeId,
  homeId,
  width,
}: {
  data: ShuttleData;
  routeId: string;
  homeId: string;
  width: number;
}) {
  const stops = stopsOnRoute(data, routeId);
  const vehicles = (data.vehicles ?? []).filter((v) => v.routeId === routeId);
  const { stops: st, vehicles: vt } = alongRoute(stops, vehicles);
  const H = 28;
  const pad = 8;
  const x = (f: number) => pad + f * (width - pad * 2);
  return (
    <Svg width={width} height={H} viewBox={`0 0 ${width} ${H}`}>
      <Line
        x1={pad}
        y1={H / 2}
        x2={width - pad}
        y2={H / 2}
        stroke={colors.onDarkFaint}
        strokeWidth={2}
      />
      {stops.map((s, i) => (
        <Circle
          key={s.id}
          cx={x(st[i])}
          cy={H / 2}
          r={s.id === homeId ? 5 : 3}
          fill={s.id === homeId ? colors.onDark : colors.onDarkMuted}
        />
      ))}
      {vt.map((v) => (
        <Rect
          key={v.id}
          x={x(v.t) - 6}
          y={H / 2 - 5}
          width={12}
          height={10}
          rx={2}
          fill={colors.onDark}
        />
      ))}
    </Svg>
  );
}

export function BranVanCollapsed() {
  const { shuttle } = useSources();
  const stop = useHomeStop();
  const [width, setWidth] = useState(0);
  if (!stop) {
    return (
      <CollapsedShell title="BranVan" icon="truck">
        <Text style={t.body}>Pick your stop</Text>
      </CollapsedShell>
    );
  }
  const next = arrivalsAt(shuttle.data, stop.id)[0];
  const routeId = next?.routeId ?? routeServing(shuttle.data, stop.id);
  return (
    <CollapsedShell title="BranVan" icon="truck">
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {routeId && width > 0 ? (
          <RouteStrip
            data={shuttle.data}
            routeId={routeId}
            homeId={stop.id}
            width={width}
          />
        ) : null}
      </View>
      <Text style={t.stat}>{next ? minutesLabel(next.minutes) : "—"}</Text>
      <Text style={t.muted} numberOfLines={1}>
        {next ? `${next.routeName} at ${stop.name}` : stop.name}
      </Text>
    </CollapsedShell>
  );
}

export function BranVanExpanded() {
  const { shuttle } = useSources();
  const { update } = usePreferences();
  const home = useHomeStop();
  const [routeId, setRouteId] = useState<string | null>(null);

  if (!home) {
    return (
      <ExpandedShell title="BranVan" subtitle="Which stop is closest to you?">
        <View style={{ marginTop: space.md }}>
          {shuttle.data.stops.map((s) => (
            <Pressable
              key={s.id}
              accessibilityRole="button"
              onPress={() => update({ homeStop: s.id })}
              style={({ pressed }) => [
                styles.choice,
                pressed && styles.pressed,
              ]}
            >
              <Text style={t.bodyStrong}>{s.name}</Text>
            </Pressable>
          ))}
        </View>
      </ExpandedShell>
    );
  }

  const selected =
    routeId ??
    routeServing(shuttle.data, home.id) ??
    shuttle.data.routes[0]?.id;
  const route = shuttle.data.routes.find((r) => r.id === selected);
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
        <TileButton
          icon="map-pin"
          label="Change stop"
          onPress={() => update({ homeStop: null })}
        />
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
              <Text
                style={[
                  t.small,
                  { fontWeight: "600" },
                  r.id === route?.id && { color: colors.text },
                ]}
              >
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
  const vehicles = (data.vehicles ?? []).filter((v) => v.routeId === routeId);
  const { at, points } = project(stops, MAP_W, MAP_H, 28);
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
          stroke={colors.onDarkFaint}
          strokeWidth={3}
          strokeLinejoin="round"
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
              r={isHome ? 7 : 4.5}
              fill={isHome ? colors.onDark : colors.onDarkMuted}
            />
          );
        })}
        {vehicles.map((v) => {
          const p = at(v.lat, v.lon);
          return (
            <Rect
              key={v.id}
              x={p.x - 7}
              y={p.y - 6}
              width={14}
              height={12}
              rx={3}
              fill={colors.onDark}
              stroke="rgba(0,0,0,0.35)"
              strokeWidth={1}
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
              fill={colors.onDark}
              fontSize={11}
              fontFamily={font.medium}
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
  choice: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.onDarkLine,
  },
  tabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: space.md,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.onDarkFill,
  },
  tabOn: { backgroundColor: colors.onDark },
  map: {
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.18)",
    marginBottom: space.md,
    overflow: "hidden",
  },
  pressed: { opacity: 0.7 },
});
