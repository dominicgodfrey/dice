// Laundry tile (PLAN.md D18): the student's building as a grid of machines
// collapsed; every building with per-machine state expanded. The building
// is asked for on the first expand and is a preference.

import { Pressable, StyleSheet, View } from "react-native";
import { usePreferences } from "../../preferences/store";
import { originLabel, useSources } from "../../sources/SourcesProvider";
import type { LaundryBuilding, Machine } from "../../sources/types";
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
import { countBuilding, countsLine, machineLabel } from "./laundry";

function useBuilding(): LaundryBuilding | null {
  const { laundry } = useSources();
  const { prefs } = usePreferences();
  return (
    laundry.data.buildings.find((b) => b.id === prefs.laundryBuilding) ?? null
  );
}

/** One shape per machine: washers round, dryers square; filled when free,
 * outlined with minutes when busy, dashed when broken. */
function MachineGrid({
  machines,
  size = 30,
}: {
  machines: Machine[];
  size?: number;
}) {
  return (
    <View style={styles.grid}>
      {machines.map((m) => {
        const free = m.status === "available";
        const broken = m.status === "out_of_order";
        return (
          <View
            key={m.id}
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
            {!free && !broken && m.minutesLeft !== null ? (
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
  const building = useBuilding();
  if (!building) {
    return (
      <CollapsedShell title="Laundry" icon="droplet">
        <Text style={t.body}>Pick your building</Text>
      </CollapsedShell>
    );
  }
  const c = countBuilding(building);
  const machines = building.rooms.flatMap((r) => r.machines);
  return (
    <CollapsedShell title="Laundry" icon="droplet">
      <MachineGrid machines={machines} size={26} />
      <Text style={[t.bodyStrong, { marginTop: 8 }]} numberOfLines={1}>
        {countsLine(c)}
      </Text>
      <Text style={t.muted} numberOfLines={1}>
        {building.name}
      </Text>
    </CollapsedShell>
  );
}

export function LaundryExpanded() {
  const { laundry } = useSources();
  const { update } = usePreferences();
  const building = useBuilding();

  if (!building) {
    return (
      <ExpandedShell title="Laundry" subtitle="Which building do you live in?">
        <View style={{ marginTop: space.md }}>
          {laundry.data.buildings.map((b) => (
            <Pressable
              key={b.id}
              accessibilityRole="button"
              onPress={() => update({ laundryBuilding: b.id })}
              style={({ pressed }) => [
                styles.choice,
                pressed && styles.pressed,
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={t.bodyStrong}>{b.name}</Text>
                <Text style={t.muted}>{countsLine(countBuilding(b))}</Text>
              </View>
              <MachineGrid
                machines={b.rooms.flatMap((r) => r.machines)}
                size={16}
              />
            </Pressable>
          ))}
        </View>
      </ExpandedShell>
    );
  }

  const c = countBuilding(building);
  const others = laundry.data.buildings.filter((b) => b.id !== building.id);
  return (
    <ExpandedShell title="Laundry" subtitle={originLabel(laundry)}>
      <Text style={[t.heading, { marginTop: space.lg }]}>{building.name}</Text>
      <Text style={t.muted}>{countsLine(c)}</Text>
      {building.rooms.map((room) => (
        <Section key={room.id} title={room.name}>
          <MachineGrid machines={room.machines} />
          <View style={{ marginTop: space.sm }}>
            {room.machines.map((m) => (
              <Row
                key={m.id}
                left={`${m.type === "washer" ? "Washer" : "Dryer"} ${m.id.replace(/^[wd]/, "")}`}
                right={machineLabel(m)}
                strong={m.status === "available"}
              />
            ))}
          </View>
        </Section>
      ))}
      {c.washersFree === 0 && c.nextWasher !== null ? (
        <Text style={[t.muted, { marginTop: space.md }]}>
          Next washer free in about {c.nextWasher} min.
        </Text>
      ) : null}
      <TileButton
        icon="home"
        label="Change building"
        onPress={() => update({ laundryBuilding: null })}
      />
      {others.length ? (
        <Section title="Other buildings">
          {others.map((b) => (
            <Row
              key={b.id}
              left={b.name}
              right={countsLine(countBuilding(b))}
            />
          ))}
        </Section>
      ) : null}
    </ExpandedShell>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
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
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.onDarkLine,
  },
  pressed: { opacity: 0.7 },
});
