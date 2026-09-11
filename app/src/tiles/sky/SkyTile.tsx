// Sky tile (PLAN.md D17, D38): a chart of what is above Brandeis right now:
// constellations, planets, the moon. Collapsed, a small chart with the
// constellations up; expanded, the full chart with labels, your own
// location on request, and the phone's compass to turn the chart the way
// you are facing.

import * as Location from "expo-location";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { compassPoint, moonPhase } from "../../sky/bodies";
import { chartAt, constellationsUp, type Observer } from "../../sky/chart";
import { StarChart } from "../../sky/StarChart";
import { CAMPUS, skyFor, sunAltitude, sunTimes } from "../../sky/sun";
import { useHeading } from "../../sky/useHeading";
import { Text } from "../../ui/Text";
import { colors, space } from "../../ui/theme";
import { formatClock } from "../../util/time";
import { useNow } from "../../util/useNow";
import {
  CollapsedShell,
  ExpandedShell,
  Row,
  Section,
  t,
  TileButton,
} from "../shells";

const HERE: Observer = { lat: CAMPUS.lat, lon: CAMPUS.lon };

export function SkyCollapsed() {
  const now = useNow();
  const chart = useMemo(() => chartAt(now, HERE), [now]);
  const up = constellationsUp(chart).slice(0, 3);
  const { sunrise, sunset } = sunTimes(now);
  const isDay = sunAltitude(now) > 0;
  const [box, setBox] = useState({ w: 0, h: 0 });
  const size = Math.max(0, Math.min(box.w, box.h - 44));
  return (
    <CollapsedShell title="Sky" icon="moon">
      <View
        style={styles.collapsedBody}
        onLayout={(e) =>
          setBox({
            w: e.nativeEvent.layout.width,
            h: e.nativeEvent.layout.height,
          })
        }
      >
        {size > 40 ? (
          <View style={styles.chartCentre}>
            <StarChart chart={chart} size={size} labels={false} compact />
          </View>
        ) : null}
        <View>
          <Text style={t.bodyStrong} numberOfLines={1}>
            {up.length
              ? up.map((c) => c.name).join(", ")
              : skyFor(sunAltitude(now)).label}
          </Text>
          <Text style={t.muted} numberOfLines={1}>
            {isDay
              ? `Sunset ${formatClock(sunset ?? now)}`
              : `Sunrise ${formatClock(sunrise ?? now)}`}{" "}
            · {moonPhase(now).name}
          </Text>
        </View>
      </View>
    </CollapsedShell>
  );
}

export function SkyExpanded() {
  const now = useNow(30_000);
  const [observer, setObserver] = useState<Observer>(HERE);
  const [locating, setLocating] = useState<
    "idle" | "working" | "denied" | "on"
  >("idle");
  const heading = useHeading();
  const chart = useMemo(() => chartAt(now, observer), [now, observer]);
  const up = constellationsUp(chart);
  const bodiesUp = chart.bodies.filter((b) => b.alt > 0 && b.id !== "sun");
  const moon = moonPhase(now);
  const { sunrise, sunset } = sunTimes(now);
  const [width, setWidth] = useState(0);
  const size = Math.min(width, 420);
  const rotation = heading.state.status === "on" ? heading.state.heading : 0;

  const locate = async () => {
    setLocating("working");
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") return setLocating("denied");
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setObserver({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      setLocating("on");
    } catch {
      setLocating("denied");
    }
  };

  return (
    <ExpandedShell
      title="Sky"
      subtitle={`${skyFor(sunAltitude(now)).label} · ${observer === HERE ? "over campus" : "over you"}`}
    >
      <View
        style={styles.chartWrap}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      >
        {size > 0 ? (
          <StarChart chart={chart} size={size} heading={rotation} />
        ) : null}
      </View>
      <Text style={[t.muted, styles.hint]}>
        {heading.state.status === "on"
          ? `Turning with you · facing ${compassPoint(rotation)}. Hold the phone flat and look up.`
          : "North is at the top, as if you were lying on your back looking up. East is on the left."}
      </Text>
      <View style={styles.controls}>
        <TileButton
          icon="compass"
          label={
            heading.state.status === "on"
              ? "Stop compass"
              : heading.state.status === "asking"
                ? "Asking…"
                : "Use compass"
          }
          onPress={heading.state.status === "on" ? heading.stop : heading.start}
        />
        <TileButton
          icon="map-pin"
          label={
            locating === "on"
              ? "Back to campus"
              : locating === "working"
                ? "Locating…"
                : "Use my location"
          }
          onPress={() => {
            if (locating === "on") {
              setObserver(HERE);
              setLocating("idle");
            } else locate();
          }}
        />
      </View>
      {heading.state.status === "denied" ? (
        <Text style={t.muted}>{heading.state.reason}</Text>
      ) : null}
      {locating === "denied" ? (
        <Text style={t.muted}>Location was not available; showing campus.</Text>
      ) : null}

      <Section title="Constellations up">
        {up.length === 0 ? (
          <Text style={t.body}>None high enough yet.</Text>
        ) : null}
        {up.map((c) => (
          <Row
            key={c.abbr}
            left={c.name}
            right={`${compassPoint(c.az)} · ${Math.round(c.alt)}° up`}
          />
        ))}
      </Section>
      <Section title="Planets and moon">
        {bodiesUp.length === 0 ? (
          <Text style={t.body}>None above the horizon.</Text>
        ) : null}
        {bodiesUp.map((b) => (
          <Row
            key={b.id}
            left={b.name}
            right={`${compassPoint(b.az)} · ${Math.round(b.alt)}° up`}
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
      <Text style={[t.muted, { marginTop: space.lg }]}>
        Your location and compass are used only on this screen and never leave
        the phone.
      </Text>
    </ExpandedShell>
  );
}

const styles = StyleSheet.create({
  collapsedBody: { flex: 1, justifyContent: "space-between" },
  chartCentre: { alignItems: "center", flex: 1, justifyContent: "center" },
  chartWrap: { alignItems: "center", marginTop: space.lg },
  hint: { marginTop: space.md, textAlign: "center", color: colors.onDarkMuted },
  controls: {
    flexDirection: "row",
    gap: space.sm,
    flexWrap: "wrap",
    justifyContent: "center",
  },
});
