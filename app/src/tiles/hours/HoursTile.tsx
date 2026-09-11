// Hours tile (PLAN.md D16): three followed venues collapsed; every followed
// venue by category with weekly hours expanded; follow list at the bottom.

import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { usePreferences } from "../../preferences/store";
import { originLabel, useSources } from "../../sources/SourcesProvider";
import type { Venue, VenueCategory, Weekday } from "../../sources/types";
import { Icon } from "../../ui/Icon";
import { Text } from "../../ui/Text";
import { colors, space } from "../../ui/theme";
import { formatClockRange, startOfDay } from "../../util/time";
import { useNow } from "../../util/useNow";
import { CollapsedShell, ExpandedShell, Row, Section, t } from "../shells";
import {
  followedIds,
  statusAt,
  statusLabel,
  statusSortKey,
  toggleFollowed,
} from "./hours";

const OPEN = "#7BE0A0";
const CLOSED = "#FF9B8F";

const CATEGORY_TITLES: Record<VenueCategory, string> = {
  dining: "Dining halls",
  cafe: "Cafés",
  library: "Library",
  gym: "Gym",
  office: "Offices",
};
const WEEK: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const WEEK_LABEL: Record<Weekday, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

function useFollowedVenues(now: Date) {
  const { venues } = useSources();
  const { prefs } = usePreferences();
  return useMemo(() => {
    const ids = new Set(followedIds(prefs));
    return venues.data.venues
      .filter((v) => ids.has(v.id))
      .map((v) => ({ venue: v, status: statusAt(v, now) }))
      .sort((a, b) => statusSortKey(a.status) - statusSortKey(b.status));
  }, [venues.data, prefs, now]);
}

export function HoursCollapsed() {
  const now = useNow(30_000);
  const rows = useFollowedVenues(now).slice(0, 3);
  return (
    <CollapsedShell title="Hours" icon="clock">
      {rows.map(({ venue, status }) => (
        <View key={venue.id} style={styles.line}>
          <View
            style={[
              styles.dot,
              { backgroundColor: status.open ? OPEN : CLOSED },
            ]}
          />
          <Text style={[t.bodyStrong, styles.name]} numberOfLines={1}>
            {venue.name.replace(" Dining Hall", "")}
          </Text>
          <Text style={t.muted} numberOfLines={1}>
            {statusLabel(status, now)}
          </Text>
        </View>
      ))}
    </CollapsedShell>
  );
}

export function HoursExpanded() {
  const now = useNow(30_000);
  const { venues } = useSources();
  const { prefs, update } = usePreferences();
  const followed = useFollowedVenues(now);
  const followedSet = new Set(followedIds(prefs));

  const byCategory = new Map<
    VenueCategory,
    { venue: Venue; status: ReturnType<typeof statusAt> }[]
  >();
  for (const item of followed) {
    const list = byCategory.get(item.venue.category) ?? [];
    list.push(item);
    byCategory.set(item.venue.category, list);
  }
  const today = startOfDay(now);
  const todayKey = WEEK[(today.getDay() + 6) % 7];

  return (
    <ExpandedShell title="Hours" subtitle={originLabel(venues)}>
      {[...byCategory.entries()].map(([category, items]) => (
        <Section key={category} title={CATEGORY_TITLES[category]}>
          {items.map(({ venue, status }) => (
            <View key={venue.id} style={styles.venue}>
              <View style={styles.venueHead}>
                <View style={styles.venueTitle}>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: status.open ? OPEN : CLOSED },
                    ]}
                  />
                  <Text style={t.heading}>{venue.name}</Text>
                </View>
                <Text
                  style={[
                    t.small,
                    { color: status.open ? OPEN : CLOSED, fontWeight: "600" },
                  ]}
                >
                  {statusLabel(status, now)}
                </Text>
              </View>
              <Text style={[t.muted, styles.location]}>{venue.location}</Text>
              {WEEK.map((d) => {
                const ranges = venue.hours[d] ?? [];
                return (
                  <Row
                    key={d}
                    left={WEEK_LABEL[d]}
                    strong={d === todayKey}
                    right={
                      ranges.length
                        ? ranges
                            .map((r) => formatClockRange(r, today))
                            .join(", ")
                        : "Closed"
                    }
                  />
                );
              })}
            </View>
          ))}
        </Section>
      ))}
      <Section title="Follow">
        {venues.data.venues.map((v) => {
          const on = followedSet.has(v.id);
          return (
            <Pressable
              key={v.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              onPress={() => update((p) => toggleFollowed(p, v.id))}
              style={({ pressed }) => [
                styles.follow,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.check, on && styles.checkOn]}>
                {on ? (
                  <Icon name="check" size={13} color={colors.text} />
                ) : null}
              </View>
              <Text style={[t.body, { flex: 1 }]}>{v.name}</Text>
            </Pressable>
          );
        })}
      </Section>
    </ExpandedShell>
  );
}

const styles = StyleSheet.create({
  line: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 3,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  name: { flex: 1 },
  venue: { marginBottom: space.xl },
  venueHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  venueTitle: { flexDirection: "row", alignItems: "center", gap: 8 },
  location: { marginBottom: 6, marginTop: 2 },
  follow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    gap: space.md,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.onDarkFaint,
    alignItems: "center",
    justifyContent: "center",
  },
  checkOn: { backgroundColor: colors.onDark, borderColor: colors.onDark },
  pressed: { opacity: 0.6 },
});
