// Laundry tile (PLAN.md D18): the student's building collapsed; every
// building with per-machine state expanded. The building is asked for on
// the first expand and is a preference.

import { Pressable, StyleSheet, Text, View } from "react-native";
import { usePreferences } from "../../preferences/store";
import { originLabel, useSources } from "../../sources/SourcesProvider";
import type { LaundryBuilding } from "../../sources/types";
import {
  CollapsedShell,
  ExpandedShell,
  Row,
  Section,
  shellStyles,
} from "../shells";
import { countBuilding, countsLine, machineLabel } from "./laundry";

function useBuilding(): LaundryBuilding | null {
  const { laundry } = useSources();
  const { prefs } = usePreferences();
  return (
    laundry.data.buildings.find((b) => b.id === prefs.laundryBuilding) ?? null
  );
}

export function LaundryCollapsed() {
  const building = useBuilding();
  if (!building) {
    return (
      <CollapsedShell title="Laundry">
        <Text style={[shellStyles.line, styles.white]}>Pick your building</Text>
      </CollapsedShell>
    );
  }
  const c = countBuilding(building);
  return (
    <CollapsedShell title="Laundry">
      <Text style={[shellStyles.big, styles.white]}>{c.washersFree}</Text>
      <Text style={[shellStyles.small, styles.dim]}>{countsLine(c)}</Text>
      <Text style={[shellStyles.small, styles.dim]} numberOfLines={1}>
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
        {laundry.data.buildings.map((b) => (
          <Pressable
            key={b.id}
            accessibilityRole="button"
            onPress={() => update({ laundryBuilding: b.id })}
            style={({ pressed }) => [styles.choice, pressed && styles.pressed]}
          >
            <Text style={[shellStyles.line, styles.white, styles.bold]}>
              {b.name}
            </Text>
            <Text style={[shellStyles.small, styles.dim]}>
              {countsLine(countBuilding(b))}
            </Text>
          </Pressable>
        ))}
      </ExpandedShell>
    );
  }

  const others = laundry.data.buildings.filter((b) => b.id !== building.id);
  return (
    <ExpandedShell title="Laundry" subtitle={originLabel(laundry)}>
      <BuildingDetail building={building} />
      <Pressable
        accessibilityRole="button"
        onPress={() => update({ laundryBuilding: null })}
        style={({ pressed }) => [styles.change, pressed && styles.pressed]}
      >
        <Text style={[shellStyles.small, styles.white, styles.bold]}>
          Change building
        </Text>
      </Pressable>
      {others.map((b) => (
        <Section key={b.id} title={b.name}>
          <Text style={[shellStyles.line, styles.white]}>
            {countsLine(countBuilding(b))}
          </Text>
        </Section>
      ))}
    </ExpandedShell>
  );
}

function BuildingDetail({ building }: { building: LaundryBuilding }) {
  const c = countBuilding(building);
  return (
    <View>
      <Text style={[shellStyles.big, styles.white, styles.headline]}>
        {building.name}
      </Text>
      <Text style={[shellStyles.line, styles.dim]}>{countsLine(c)}</Text>
      {building.rooms.map((room) => (
        <Section key={room.id} title={room.name}>
          {room.machines.map((m) => (
            <Row
              key={m.id}
              left={`${m.type === "washer" ? "Washer" : "Dryer"} ${m.id.replace(/^[wd]/, "")}`}
              right={machineLabel(m)}
              strong={m.status === "available"}
            />
          ))}
        </Section>
      ))}
      {c.washersFree === 0 && c.nextWasher !== null ? (
        <Text style={[shellStyles.small, styles.dim, styles.note]}>
          Next washer free in about {c.nextWasher} min.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  white: { color: "#ffffff" },
  dim: { color: "rgba(255,255,255,0.8)" },
  bold: { fontWeight: "700" },
  headline: { marginTop: 8 },
  choice: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.25)",
  },
  change: {
    marginTop: 16,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  note: { marginTop: 12 },
  pressed: { opacity: 0.7 },
});
