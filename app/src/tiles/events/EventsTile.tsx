// Events tile: the next event collapsed, with a date badge; today and this
// week expanded, each with an add-to-Google link.

import { Linking, Pressable, StyleSheet, View } from "react-native";
import { originLabel, useSources } from "../../sources/SourcesProvider";
import type { CampusEvent } from "../../sources/types";
import { Icon } from "../../ui/Icon";
import { Text } from "../../ui/Text";
import { colors, space, type } from "../../ui/theme";
import { formatClock } from "../../util/time";
import { useNow } from "../../util/useNow";
import { CollapsedShell, ExpandedShell, Section, t } from "../shells";
import {
  googleCalendarUrl,
  groupByDay,
  isAllDay,
  upcoming,
  whenLabel,
} from "./events";

function DateBadge({ date, size = 48 }: { date: Date; size?: number }) {
  return (
    <View style={[styles.badge, { width: size, height: size }]}>
      <Text style={styles.badgeDay}>{date.getDate()}</Text>
      <Text style={styles.badgeWeekday}>
        {date.toLocaleDateString(undefined, { weekday: "short" })}
      </Text>
    </View>
  );
}

export function EventsCollapsed() {
  const now = useNow();
  const { events } = useSources();
  const list = upcoming(events.data.events, now);
  const next = list[0];
  const after = list[1];
  return (
    <CollapsedShell title="Events" icon="calendar">
      {next ? (
        <View style={styles.next}>
          <DateBadge date={new Date(next.start)} />
          <View style={{ flex: 1 }}>
            <Text style={t.bodyStrong} numberOfLines={2}>
              {next.title}
            </Text>
            <Text style={t.muted} numberOfLines={1}>
              {whenLabel(next, now)}
              {next.location ? ` · ${next.location}` : ""}
            </Text>
            {after ? (
              <Text style={[t.muted, { marginTop: 4 }]} numberOfLines={1}>
                Then {after.title}, {whenLabel(after, now)}
              </Text>
            ) : null}
          </View>
        </View>
      ) : (
        <Text style={t.body}>Nothing coming up</Text>
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
        <Text style={[t.body, { marginTop: space.lg }]}>
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
        <Text style={t.bodyStrong}>{event.title}</Text>
        <Text style={t.muted}>
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
        <Icon name="plus" size={14} color={colors.onDark} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  next: { flexDirection: "row", alignItems: "center", gap: space.md },
  badge: {
    borderRadius: 10,
    backgroundColor: colors.onDark,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeDay: {
    fontSize: 20,
    lineHeight: 22,
    fontWeight: "600",
    color: colors.text,
  },
  badgeWeekday: {
    ...type.label,
    color: colors.muted,
    textTransform: "uppercase",
    lineHeight: 13,
  },
  event: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.onDarkLine,
  },
  eventText: { flex: 1 },
  add: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.onDarkFaint,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.7 },
});
