// Food tile (PLAN.md D16): one headline per dining hall for the current
// meal, with how far through it we are; expanded, each hall's meals with
// stations and items, and the Grubhub link.

import { Linking, StyleSheet, View } from "react-native";
import { originLabel, useSources } from "../../sources/SourcesProvider";
import { ENTRY_BY_ID } from "../../search/entries";
import { Text } from "../../ui/Text";
import { colors, space } from "../../ui/theme";
import { atClock, formatClock } from "../../util/time";
import { useNow } from "../../util/useNow";
import {
  CollapsedShell,
  ExpandedShell,
  Section,
  t,
  TileButton,
} from "../shells";
import { mealAt, mealLine, mealsOn, type MealNow } from "./food";

const GRUBHUB = ENTRY_BY_ID.get("grubhub");

function useHalls() {
  const { venues } = useSources();
  return venues.data.venues.filter((v) => v.category === "dining");
}

/** 0..1 through the current meal, or null. */
function progress(m: MealNow, now: Date): number | null {
  if (m.state !== "now") return null;
  const start = atClock(now, m.meal.start).getTime();
  const end = m.until.getTime();
  return Math.min(1, Math.max(0, (now.getTime() - start) / (end - start)));
}

export function FoodCollapsed() {
  const now = useNow(30_000);
  const halls = useHalls();
  return (
    <CollapsedShell title="Food" icon="coffee">
      {halls.map((h) => {
        const m = mealAt(h, now);
        const p = progress(m, now);
        return (
          <View key={h.id} style={styles.hall}>
            <View style={styles.hallLine}>
              <Text style={t.bodyStrong} numberOfLines={1}>
                {h.name.replace(" Dining Hall", "")}
              </Text>
              <Text style={t.muted} numberOfLines={1}>
                {mealLine(m)}
              </Text>
            </View>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${Math.round((p ?? 0) * 100)}%` },
                ]}
              />
            </View>
          </View>
        );
      })}
    </CollapsedShell>
  );
}

export function FoodExpanded() {
  const now = useNow(30_000);
  const halls = useHalls();
  const { menus } = useSources();
  return (
    <ExpandedShell title="Food" subtitle={originLabel(menus)}>
      {halls.map((h) => {
        const current = mealAt(h, now);
        const currentName =
          current.state === "now" || current.state === "next"
            ? current.meal.name
            : null;
        return (
          <Section key={h.id} title={h.name}>
            <Text style={t.bodyStrong}>{mealLine(current)}</Text>
            {mealsOn(h, now).map((meal) => {
              const stations = menus.data.halls[h.id]?.[meal.name] ?? [];
              const isCurrent = meal.name === currentName;
              return (
                <View
                  key={meal.name}
                  style={[styles.meal, isCurrent && styles.mealCurrent]}
                >
                  <View style={styles.mealHead}>
                    <Text style={t.heading}>{meal.name}</Text>
                    <Text style={t.muted}>
                      {formatClock(atClock(now, meal.start))} –{" "}
                      {formatClock(atClock(now, meal.end))}
                    </Text>
                  </View>
                  {stations.length === 0 ? (
                    <Text style={t.muted}>Menu not available</Text>
                  ) : (
                    stations.map((s) => (
                      <View key={s.station} style={styles.station}>
                        <Text style={t.label}>{s.station}</Text>
                        <Text style={t.body}>{s.items.join(" · ")}</Text>
                      </View>
                    ))
                  )}
                </View>
              );
            })}
          </Section>
        );
      })}
      {GRUBHUB && GRUBHUB.action.kind === "url" ? (
        <TileButton
          icon="external-link"
          label="Order ahead on Grubhub"
          onPress={() => {
            const a = GRUBHUB.action;
            if (a.kind === "url") Linking.openURL(a.url).catch(() => {});
          }}
        />
      ) : null}
    </ExpandedShell>
  );
}

const styles = StyleSheet.create({
  hall: { marginTop: 8 },
  hallLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 8,
  },
  track: {
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.onDarkFill,
    marginTop: 6,
    overflow: "hidden",
  },
  fill: { height: 3, backgroundColor: colors.onDark, borderRadius: 2 },
  meal: {
    marginTop: space.md,
    padding: space.md,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.14)",
  },
  mealCurrent: { backgroundColor: colors.onDarkFill },
  mealHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 6,
  },
  station: { marginTop: 8 },
});
