// Food tile (PLAN.md D16): one headline per dining hall for the current
// meal; expanded, a table per hall per meal with stations and items, and
// the Grubhub link.

import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { originLabel, useSources } from "../../sources/SourcesProvider";
import { ENTRY_BY_ID } from "../../search/entries";
import { atClock, formatClock } from "../../util/time";
import { useNow } from "../../util/useNow";
import { CollapsedShell, ExpandedShell, Section, shellStyles } from "../shells";
import { mealAt, mealLine, mealsOn } from "./food";

const GRUBHUB = ENTRY_BY_ID.get("grubhub");

function useHalls() {
  const { venues } = useSources();
  return venues.data.venues.filter((v) => v.category === "dining");
}

export function FoodCollapsed() {
  const now = useNow(30_000);
  const halls = useHalls();
  return (
    <CollapsedShell title="Food">
      {halls.map((h) => (
        <View key={h.id} style={styles.line}>
          <Text style={[shellStyles.line, styles.name]} numberOfLines={1}>
            {h.name.replace(" Dining Hall", "")}
          </Text>
          <Text style={[shellStyles.small, styles.meal]} numberOfLines={1}>
            {mealLine(mealAt(h, now))}
          </Text>
        </View>
      ))}
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
            <Text style={[shellStyles.line, styles.headline]}>
              {mealLine(current)}
            </Text>
            {mealsOn(h, now).map((meal) => {
              const stations = menus.data.halls[h.id]?.[meal.name] ?? [];
              const isCurrent = meal.name === currentName;
              return (
                <View
                  key={meal.name}
                  style={[styles.meal, isCurrent && styles.mealCurrent]}
                >
                  <View style={styles.mealHead}>
                    <Text style={[shellStyles.big, styles.white]}>
                      {meal.name}
                    </Text>
                    <Text style={[shellStyles.small, styles.dim]}>
                      {formatClock(atClock(now, meal.start))} –{" "}
                      {formatClock(atClock(now, meal.end))}
                    </Text>
                  </View>
                  {stations.length === 0 ? (
                    <Text style={[shellStyles.small, styles.dim]}>
                      Menu not available
                    </Text>
                  ) : (
                    stations.map((s) => (
                      <View key={s.station} style={styles.station}>
                        <Text style={[shellStyles.small, styles.stationName]}>
                          {s.station}
                        </Text>
                        <Text style={[shellStyles.line, styles.white]}>
                          {s.items.join(" · ")}
                        </Text>
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
        <Pressable
          accessibilityRole="link"
          onPress={() => {
            const a = GRUBHUB.action;
            if (a.kind === "url") Linking.openURL(a.url).catch(() => {});
          }}
          style={({ pressed }) => [styles.grubhub, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.grubhubText}>
            {GRUBHUB.icon} Order ahead on Grubhub
          </Text>
        </Pressable>
      ) : null}
    </ExpandedShell>
  );
}

const styles = StyleSheet.create({
  line: { paddingVertical: 3 },
  name: { color: "#ffffff", fontWeight: "700" },
  meal: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  mealCurrent: { backgroundColor: "rgba(255,255,255,0.18)" },
  mealHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 6,
  },
  headline: { color: "#ffffff", fontWeight: "600" },
  white: { color: "#ffffff" },
  dim: { color: "rgba(255,255,255,0.75)" },
  station: { marginTop: 6 },
  stationName: {
    color: "rgba(255,255,255,0.75)",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  grubhub: {
    marginTop: 28,
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  grubhubText: { color: "#E8613C", fontWeight: "700", fontSize: 15 },
});
