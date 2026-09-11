// Laundry tile (PLAN.md D18): the student's room as a grid of machines
// collapsed; every room with per-machine state expanded. The room (one
// building's laundry on LaundryView) is asked for on the first expand and is
// a preference. When nothing on campus reports, LaundryView itself is down
// and the tile says so instead of calling every machine broken.

import { Pressable, StyleSheet, View } from "react-native";
import { usePreferences } from "../../preferences/store";
import { originLabel, useSources } from "../../sources/SourcesProvider";
import type {
  LaundryBuilding,
  LaundryRoom,
  Machine,
} from "../../sources/types";
import { Text } from "../../ui/Text";
import { colors, space, type } from "../../ui/theme";
import {
  CollapsedShell,
  ExpandedShell,
  Row,
  Section,
  t,
  TileButton,
} from "../shells";
import { countMachines, countsLine, machineLabel, systemDown } from "./laundry";

type Found = { room: LaundryRoom; building: LaundryBuilding };

function useRoom(): Found | null {
  const { laundry } = useSources();
  const { prefs } = usePreferences();
  for (const building of laundry.data.buildings) {
    const room = building.rooms.find((r) => r.id === prefs.laundryRoom);
    if (room) return { room, building };
  }
  return null;
}

const DOWN_TITLE = "LaundryView is down";
const DOWN_BODY =
  "No room on campus is reporting, so this is on their end, not the machines. Check in person.";

/** One shape per machine: washers round, dryers square; filled when free,
 * outlined with minutes when busy, dashed when broken or not reporting. */
function MachineGrid({
  machines,
  size = 30,
}: {
  machines: Machine[];
  size?: number;
}) {
  return (
    <View style={[styles.grid, { gap: size < 20 ? 4 : 6 }]}>
      {machines.map((m, i) => {
        const free = m.status === "available";
        const broken = m.status === "out_of_order" || m.status === "offline";
        // IDs repeat across rooms ("01" in every room).
        return (
          <View
            key={i}
            accessibilityLabel={`${m.type} ${machineLabel(m)}`}
            style={[
              styles.machine,
              {
                width: size,
                height: size,
                borderRadius: m.type === "washer" ? size / 2 : 7,
              },
              free && styles.machineFree,
              broken && styles.machineBroken,
            ]}
          >
            {size >= 18 && !free && !broken && m.minutesLeft !== null ? (
              <Text style={[styles.minutes, { fontSize: size >= 30 ? 11 : 9 }]}>
                {m.minutesLeft}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

export function LaundryCollapsed() {
  const { laundry } = useSources();
  const found = useRoom();
  if (systemDown(laundry.data.buildings)) {
    return (
      <CollapsedShell title="Laundry" icon="droplet">
        <Text style={t.bodyStrong}>{DOWN_TITLE}</Text>
        <Text style={t.muted}>Nothing on campus is reporting</Text>
      </CollapsedShell>
    );
  }
  if (!found) {
    return (
      <CollapsedShell title="Laundry" icon="droplet">
        <Text style={t.body}>Pick your building</Text>
      </CollapsedShell>
    );
  }
  const { room, building } = found;
  const c = countMachines(room.machines);
  // Shapiro has 30 machines; shrink the shapes so the counts line stays.
  const n = room.machines.length;
  const size = n <= 8 ? 26 : n <= 16 ? 18 : 12;
  return (
    <CollapsedShell title="Laundry" icon="droplet">
      <MachineGrid machines={room.machines} size={size} />
      <Text style={[t.bodyStrong, { marginTop: 8 }]} numberOfLines={1}>
        {countsLine(c)}
      </Text>
      <Text style={t.muted} numberOfLines={1}>
        {room.name} · {building.name}
      </Text>
    </CollapsedShell>
  );
}

function RoomChoice({
  room,
  onPress,
}: {
  room: LaundryRoom;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.choice, pressed && styles.pressed]}
    >
      <View style={{ flex: 1 }}>
        <Text style={t.bodyStrong}>{room.name}</Text>
        <Text style={t.muted}>{countsLine(countMachines(room.machines))}</Text>
      </View>
      <View style={styles.choiceGrid}>
        <MachineGrid machines={room.machines} size={16} />
      </View>
    </Pressable>
  );
}

export function LaundryExpanded() {
  const { laundry } = useSources();
  const { update } = usePreferences();
  const found = useRoom();
  const buildings = laundry.data.buildings;
  const downNote = systemDown(buildings) ? (
    <View style={styles.note}>
      <Text style={t.bodyStrong}>{DOWN_TITLE}</Text>
      <Text style={t.muted}>{DOWN_BODY}</Text>
    </View>
  ) : null;

  if (!found) {
    return (
      <ExpandedShell title="Laundry" subtitle="Which building do you live in?">
        {downNote}
        {buildings.map((b) => (
          <Section key={b.id} title={b.name}>
            {b.rooms.map((r) => (
              <RoomChoice
                key={r.id}
                room={r}
                onPress={() => update({ laundryRoom: r.id })}
              />
            ))}
          </Section>
        ))}
      </ExpandedShell>
    );
  }

  const { room, building } = found;
  const c = countMachines(room.machines);
  return (
    <ExpandedShell title="Laundry" subtitle={originLabel(laundry)}>
      {downNote}
      <Text style={[t.heading, { marginTop: space.lg }]}>{room.name}</Text>
      <Text style={t.muted}>
        {building.name} · {countsLine(c)}
      </Text>
      <View style={{ marginTop: space.md }}>
        <MachineGrid machines={room.machines} />
      </View>
      <View style={{ marginTop: space.sm }}>
        {room.machines.map((m, i) => (
          <Row
            key={i}
            left={`${m.type === "washer" ? "Washer" : "Dryer"} ${m.id.replace(/^[wd]/, "")}`}
            right={machineLabel(m)}
            strong={m.status === "available"}
          />
        ))}
      </View>
      {c.washersFree === 0 && c.nextWasher !== null ? (
        <Text style={[t.muted, { marginTop: space.md }]}>
          Next washer free in about {c.nextWasher} min.
        </Text>
      ) : null}
      <TileButton
        icon="home"
        label="Change building"
        onPress={() => update({ laundryRoom: null })}
      />
      {buildings.map((b) => {
        const others = b.rooms.filter((r) => r.id !== room.id);
        return others.length ? (
          <Section key={b.id} title={b.name}>
            {others.map((r) => (
              <Row
                key={r.id}
                left={r.name}
                right={countsLine(countMachines(r.machines))}
              />
            ))}
          </Section>
        ) : null;
      })}
    </ExpandedShell>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap" },
  machine: {
    borderWidth: 1.5,
    borderColor: colors.onDarkMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  machineFree: { backgroundColor: colors.onDark, borderColor: colors.onDark },
  machineBroken: { borderColor: colors.onDarkFaint, borderStyle: "dashed" },
  minutes: {
    ...type.label,
    color: colors.onDark,
    fontWeight: "600",
    lineHeight: 12,
  },
  choice: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.onDarkLine,
  },
  choiceGrid: { flexShrink: 1, maxWidth: "45%" },
  note: {
    marginTop: space.lg,
    padding: space.md,
    borderRadius: 12,
    backgroundColor: colors.onDarkFill,
  },
  pressed: { opacity: 0.7 },
});
