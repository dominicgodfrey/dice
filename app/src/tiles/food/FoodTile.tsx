// Food tile (PLAN.md D16): one headline per dining hall for the current
// meal, with how far through it we are, and a line saying the menu is a tap
// away. Expanded, each hall as a menu: pick a meal, read its stations with
// the dishes laid out to scan rather than a comma list; and the Grubhub link.

import { useState } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { originLabel, useSources } from "../../sources/SourcesProvider";
import { ENTRY_BY_ID } from "../../search/entries";
import type { Meal, MenuStation, Venue } from "../../sources/types";
import { Icon } from "../../ui/Icon";
import { Text } from "../../ui/Text";
import { colors, space, type } from "../../ui/theme";
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
      <View style={styles.menuHint}>
        <Icon name="book-open" size={14} color={colors.onDarkMuted} />
        <Text style={t.muted}>Today&rsquo;s menus</Text>
        <Icon name="chevron-right" size={14} color={colors.onDarkMuted} />
      </View>
    </CollapsedShell>
  );
}

/** One hall's menu: a row of meals to pick from, then that meal's stations. */
function HallMenu({
  hall,
  now,
  stationsFor,
}: {
  hall: Venue;
  now: Date;
  stationsFor: (meal: Meal) => MenuStation[];
}) {
  const meals = mealsOn(hall, now);
  const current = mealAt(hall, now);
  const currentName =
    current.state === "now" || current.state === "next"
      ? current.meal.name
      : null;
  const [picked, setPicked] = useState<string | null>(null);
  const shown =
    meals.find((m) => m.name === picked) ??
    meals.find((m) => m.name === currentName) ??
    meals[0];
  const stations = shown ? stationsFor(shown) : [];
  return (
    <Section title={hall.name}>
      <Text style={t.bodyStrong}>{mealLine(current)}</Text>
      {meals.length > 1 ? (
        <View style={styles.tabs}>
          {meals.map((m, i) => {
            const on = shown?.name === m.name;
            return (
              <Pressable
                key={`${m.name}-${i}`}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => setPicked(m.name)}
                style={({ pressed }) => [
                  styles.tab,
                  on && styles.tabOn,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.tabLabel, on && styles.tabLabelOn]}>
                  {m.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      {shown ? (
        <View style={styles.menu}>
          <View style={styles.menuHead}>
            <Text style={t.heading}>{shown.name}</Text>
            <Text style={t.muted}>
              {formatClock(atClock(now, shown.start))} –{" "}
              {formatClock(atClock(now, shown.end))}
            </Text>
          </View>
          {stations.length === 0 ? (
            <Text style={t.muted}>Menu not posted yet</Text>
          ) : (
            stations.map((s, i) => (
              // Station names repeat within a meal on the source pages.
              <View key={`${s.station}-${i}`} style={styles.station}>
                <Text style={styles.stationName}>{s.station}</Text>
                <View style={styles.dishes}>
                  {s.items.map((item, j) => (
                    <View key={`${item}-${j}`} style={styles.dish}>
                      <Text style={styles.dishText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))
          )}
        </View>
      ) : (
        <Text style={[t.muted, { marginTop: space.sm }]}>No meals listed</Text>
      )}
    </Section>
  );
}

export function FoodExpanded() {
  const now = useNow(30_000);
  const halls = useHalls();
  const { menus } = useSources();
  return (
    <ExpandedShell title="Food" subtitle={originLabel(menus)}>
      {halls.map((h) => (
        <HallMenu
          key={h.id}
          hall={h}
          now={now}
          stationsFor={(meal) => menus.data.halls[h.id]?.[meal.name] ?? []}
        />
      ))}
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
  menuHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  tabs: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: space.sm },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.onDarkFaint,
  },
  tabOn: { backgroundColor: colors.onDark, borderColor: colors.onDark },
  tabLabel: { ...type.small, color: colors.onDark, fontWeight: "500" },
  tabLabelOn: { color: colors.text },
  menu: {
    marginTop: space.md,
    padding: space.md,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.14)",
  },
  menuHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 8,
  },
  station: { marginTop: space.md },
  stationName: {
    ...type.small,
    color: colors.onDarkMuted,
    fontWeight: "600",
    marginBottom: 6,
  },
  dishes: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  dish: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.onDarkFill,
  },
  dishText: { ...type.small, color: colors.onDark },
  pressed: { opacity: 0.7 },
});
