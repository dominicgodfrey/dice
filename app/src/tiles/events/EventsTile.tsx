// Events tile: the next event collapsed; today and this week expanded,
// each with an add-to-Google link. Data is the fixture until the ICS
// fetcher on the server has a URL (docs/WIRING.md).

import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { originLabel, useSources } from "../../sources/SourcesProvider";
import type { CampusEvent } from "../../sources/types";
import { formatClock } from "../../util/time";
import { useNow } from "../../util/useNow";
import { CollapsedShell, ExpandedShell, Section, shellStyles } from "../shells";
import {
  googleCalendarUrl,
  groupByDay,
  isAllDay,
  upcoming,
  whenLabel,
} from "./events";

export function EventsCollapsed() {
  const now = useNow();
  const { events } = useSources();
  const next = upcoming(events.data.events, now)[0];
  return (
    <CollapsedShell title="Events">
      {next ? (
        <View>
          <Text style={[shellStyles.big, styles.white]} numberOfLines={2}>
            {next.title}
          </Text>
          <Text style={[shellStyles.small, styles.dim]} numberOfLines={1}>
            {whenLabel(next, now)}
            {next.location ? ` · ${next.location}` : ""}
          </Text>
        </View>
      ) : (
        <Text style={[shellStyles.line, styles.white]}>Nothing coming up</Text>
      )}
    </CollapsedShell>
  );
}

export function EventsExpanded() {
  const now = useNow();
  const { events } = useSources();
  const groups = groupByDay(events.data.events, now);
  return (
    <ExpandedShell title="Events" subtitle={originLabel(events)}>
      {groups.length === 0 ? (
        <Text style={[shellStyles.line, styles.white]}>
          Nothing in the next week.
        </Text>
      ) : null}
      {groups.map((g) => (
        <Section key={g.key} title={g.label}>
          {g.events.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </Section>
      ))}
    </ExpandedShell>
  );
}

function EventRow({ event }: { event: CampusEvent }) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const time = isAllDay(event)
    ? "All day"
    : `${formatClock(start)} – ${formatClock(end)}`;
  return (
    <View style={styles.event}>
      <View style={styles.eventText}>
        <Text style={[shellStyles.line, styles.white, styles.bold]}>
          {event.title}
        </Text>
        <Text style={[shellStyles.small, styles.dim]}>
          {time}
          {event.location ? ` · ${event.location}` : ""}
          {event.category === "academic" ? " · Academic calendar" : ""}
        </Text>
      </View>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`Add ${event.title} to Google Calendar`}
        onPress={() =>
          Linking.openURL(googleCalendarUrl(event)).catch(() => {})
        }
        style={({ pressed }) => [styles.add, pressed && styles.pressed]}
      >
        <Text style={[shellStyles.small, styles.white, styles.bold]}>
          + Calendar
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  white: { color: "#ffffff" },
  dim: { color: "rgba(255,255,255,0.8)" },
  bold: { fontWeight: "700" },
  event: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.25)",
  },
  eventText: { flex: 1 },
  add: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  pressed: { opacity: 0.7 },
});
