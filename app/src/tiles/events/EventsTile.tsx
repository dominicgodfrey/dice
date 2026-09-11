// Academic Calendar and Events tile (D48): the next event collapsed, with a
// date badge. Expanded, a list of the week or a calendar, by month or by
// week, with the picked day's events under it; every event has an
// add-to-Google link. The view is a preference so it sticks.

import { useState } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { usePreferences } from "../../preferences/store";
import type { EventsView } from "../../preferences/schema";
import { originLabel, useSources } from "../../sources/SourcesProvider";
import type { CampusEvent } from "../../sources/types";
import { Icon, type IconName } from "../../ui/Icon";
import { Text } from "../../ui/Text";
import { colors, space, type } from "../../ui/theme";
import { formatClock, sameDay, startOfDay } from "../../util/time";
import { useNow } from "../../util/useNow";
import { CollapsedShell, ExpandedShell, Section, t } from "../shells";
import {
  addMonths,
  eventsOn,
  googleCalendarUrl,
  groupByDay,
  isAllDay,
  monthGrid,
  monthLabel,
  upcoming,
  weekLabel,
  weekOf,
  whenLabel,
} from "./events";

const TITLE = "Academic Calendar and Events";

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
    <CollapsedShell title={TITLE} icon="calendar">
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

/** One round icon button; filled when it is the current choice. */
function IconChoice({
  icon,
  label,
  on,
  onPress,
}: {
  icon: IconName;
  label: string;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        on && styles.choiceOn,
        pressed && styles.pressed,
      ]}
    >
      <Icon name={icon} size={18} color={on ? colors.text : colors.onDark} />
    </Pressable>
  );
}

function Pill({
  label,
  on,
  onPress,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        on && styles.pillOn,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.pillLabel, on && styles.pillLabelOn]}>{label}</Text>
    </Pressable>
  );
}

/** A day cell of the month or week grid: number, up to three dots. */
function DayCell({
  day,
  count,
  today,
  selected,
  faded,
  onPress,
}: {
  day: Date;
  count: number;
  today: boolean;
  selected: boolean;
  faded: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${day.toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
      })}, ${count} event${count === 1 ? "" : "s"}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.day, pressed && styles.pressed]}
    >
      <View
        style={[
          styles.dayNumber,
          today && styles.dayToday,
          selected && styles.daySelected,
        ]}
      >
        <Text
          style={[
            styles.dayText,
            faded && styles.dayFaded,
            selected && styles.dayTextSelected,
          ]}
        >
          {day.getDate()}
        </Text>
      </View>
      <View style={styles.dots}>
        {Array.from({ length: Math.min(3, count) }, (_, i) => (
          <View key={i} style={styles.dot} />
        ))}
      </View>
    </Pressable>
  );
}

function WeekdayHeader({ days }: { days: Date[] }) {
  return (
    <View style={styles.weekRow}>
      {days.map((d) => (
        <Text key={d.getDay()} style={styles.weekday}>
          {d.toLocaleDateString(undefined, { weekday: "narrow" })}
        </Text>
      ))}
    </View>
  );
}

function Calendar({
  view,
  events,
  now,
  selected,
  onSelect,
}: {
  view: "month" | "week";
  events: readonly CampusEvent[];
  now: Date;
  selected: Date;
  onSelect: (d: Date) => void;
}) {
  const weeks = view === "month" ? monthGrid(selected) : [weekOf(selected)];
  const label = view === "month" ? monthLabel(selected) : weekLabel(selected);
  const step = (dir: 1 | -1) =>
    onSelect(
      view === "month"
        ? addMonths(selected, dir)
        : startOfDay(selected, 7 * dir),
    );
  return (
    <View style={styles.calendar}>
      <View style={styles.calendarHead}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            view === "month" ? "Previous month" : "Previous week"
          }
          onPress={() => step(-1)}
          style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}
        >
          <Icon name="chevron-left" size={18} color={colors.onDark} />
        </Pressable>
        <Text style={t.bodyStrong}>{label}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={view === "month" ? "Next month" : "Next week"}
          onPress={() => step(1)}
          style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}
        >
          <Icon name="chevron-right" size={18} color={colors.onDark} />
        </Pressable>
      </View>
      <WeekdayHeader days={weeks[0]} />
      {weeks.map((week) => (
        <View key={week[0].toISOString()} style={styles.weekRow}>
          {week.map((day) => (
            <DayCell
              key={day.toISOString()}
              day={day}
              count={eventsOn(events, day).length}
              today={sameDay(day, now)}
              selected={sameDay(day, selected)}
              faded={view === "month" && day.getMonth() !== selected.getMonth()}
              onPress={() => onSelect(day)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

export function EventsExpanded() {
  const now = useNow();
  const { events } = useSources();
  const { prefs, update } = usePreferences();
  const view = prefs.eventsView;
  const setView = (eventsView: EventsView) => update({ eventsView });
  const [selected, setSelected] = useState(() => startOfDay(now));
  const all = events.data.events;

  const listView = view === "list";
  const groups = listView ? groupByDay(all, now) : [];
  const onDay = listView ? [] : eventsOn(all, selected);

  return (
    <ExpandedShell title={TITLE} subtitle={originLabel(events)}>
      <View style={styles.toolbar}>
        <View style={styles.choices}>
          <IconChoice
            icon="list"
            label="List view"
            on={listView}
            onPress={() => setView("list")}
          />
          <IconChoice
            icon="calendar"
            label="Calendar view"
            on={!listView}
            onPress={() => setView(view === "week" ? "week" : "month")}
          />
        </View>
        {listView ? null : (
          <View style={styles.choices}>
            <Pill
              label="Month"
              on={view === "month"}
              onPress={() => setView("month")}
            />
            <Pill
              label="Week"
              on={view === "week"}
              onPress={() => setView("week")}
            />
          </View>
        )}
      </View>

      {listView ? (
        <>
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
        </>
      ) : (
        <>
          <Calendar
            view={view}
            events={all}
            now={now}
            selected={selected}
            onSelect={setSelected}
          />
          <Section
            title={selected.toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          >
            {onDay.length === 0 ? (
              <Text style={t.muted}>Nothing on this day.</Text>
            ) : (
              onDay.map((e) => <EventRow key={e.id} event={e} />)
            )}
          </Section>
        </>
      )}
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
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: space.sm,
    marginTop: space.lg,
  },
  choices: { flexDirection: "row", gap: space.sm },
  choice: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.onDarkFaint,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceOn: { backgroundColor: colors.onDark, borderColor: colors.onDark },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.onDarkFaint,
  },
  pillOn: { backgroundColor: colors.onDark, borderColor: colors.onDark },
  pillLabel: { ...type.small, color: colors.onDark, fontWeight: "500" },
  pillLabelOn: { color: colors.text },
  calendar: { marginTop: space.md },
  calendarHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: space.sm,
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  weekRow: { flexDirection: "row" },
  weekday: {
    ...type.label,
    color: colors.onDarkMuted,
    flex: 1,
    textAlign: "center",
    paddingVertical: 4,
  },
  day: { flex: 1, alignItems: "center", paddingVertical: 4 },
  dayNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dayToday: { borderWidth: 1, borderColor: colors.onDarkMuted },
  daySelected: { backgroundColor: colors.onDark },
  dayText: { ...type.body, color: colors.onDark },
  dayFaded: { color: colors.onDarkFaint },
  dayTextSelected: { color: colors.text, fontWeight: "600" },
  dots: { flexDirection: "row", gap: 3, height: 6, marginTop: 2 },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.onDarkMuted,
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
