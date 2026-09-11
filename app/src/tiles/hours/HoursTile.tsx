// Hours tile (PLAN.md D16): three followed venues collapsed; every followed
// venue by category with weekly hours expanded; follow list at the bottom.

import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { usePreferences } from "../../preferences/store";
import { originLabel, useSources } from "../../sources/SourcesProvider";
import type { Venue, VenueCategory, Weekday } from "../../sources/types";
import { formatClockRange, startOfDay } from "../../util/time";
import { useNow } from "../../util/useNow";
import {
  CollapsedShell,
  ExpandedShell,
  Row,
  Section,
  shellStyles,
} from "../shells";
import {
  followedIds,
  statusAt,
  statusLabel,
  statusSortKey,
  toggleFollowed,
} from "./hours";

const FG = "#2A1D00";
const CATEGORY_TITLES: Record<VenueCategory, string> = {
  dining: "Dining halls",
  cafe: "Cafés",
  library: "Library",
  gym: "Gym",
  office: "Offices",
};
const WEEK: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const WEEK_LABEL: Record<Weekday, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
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
    <CollapsedShell title="Hours" fg={FG}>
      {rows.map(({ venue, status }) => (
        <View key={venue.id} style={styles.line}>
          <View
            style={[
              styles.dot,
              { backgroundColor: status.open ? "#1E8E3E" : "#B3261E" },
            ]}
          />
          <Text style={[shellStyles.line, styles.name]} numberOfLines={1}>
            {venue.name}
          </Text>
          <Text style={[shellStyles.small, styles.when]} numberOfLines={1}>
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

  return (
    <ExpandedShell title="Hours" subtitle={originLabel(venues)} fg={FG}>
      {[...byCategory.entries()].map(([category, items]) => (
        <Section key={category} title={CATEGORY_TITLES[category]} fg={FG}>
          {items.map(({ venue, status }) => (
            <View key={venue.id} style={styles.venue}>
              <View style={styles.venueHead}>
                <Text style={[shellStyles.big, { color: FG }]}>
                  {venue.name}
                </Text>
                <Text
                  style={[
                    shellStyles.line,
                    {
                      color: status.open ? "#1E8E3E" : "#B3261E",
                      fontWeight: "700",
                    },
                  ]}
                >
                  {status.open ? "Open" : "Closed"} · {statusLabel(status, now)}
                </Text>
              </View>
              <Text style={[shellStyles.small, styles.location]}>
                {venue.location}
              </Text>
              {WEEK.map((d) => {
                const ranges = venue.hours[d] ?? [];
                return (
                  <Row
                    key={d}
                    fg={FG}
                    left={WEEK_LABEL[d]}
                    strong={d === WEEK[(today.getDay() + 6) % 7]}
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
      <Section title="Follow" fg={FG}>
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
              <Text style={[shellStyles.line, { color: FG, flex: 1 }]}>
                {v.name}
              </Text>
              <Text
                style={[shellStyles.small, { color: FG, fontWeight: "700" }]}
              >
                {on ? "Following" : "Follow"}
              </Text>
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
  name: { flex: 1, color: FG, fontWeight: "600" },
  when: { color: FG, opacity: 0.8 },
  venue: { marginBottom: 20 },
  venueHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: 8,
  },
  location: { color: FG, opacity: 0.7, marginBottom: 6 },
  follow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  pressed: { opacity: 0.6 },
});
