// One tile component, two layouts chosen by `expanded` (PLAN.md D9). Live
// tiles dispatch to their content; link tiles (D12) only have the collapsed
// layout; a live tile without content yet shows the plain square.

import type { ComponentType } from "react";
import { StyleSheet, Text, View } from "react-native";
import { FoodCollapsed, FoodExpanded } from "./food/FoodTile";
import { HoursCollapsed, HoursExpanded } from "./hours/HoursTile";
import type { TileDef, TileId } from "./registry";
import { ExpandedShell } from "./shells";

type Content = { Collapsed: ComponentType; Expanded: ComponentType };

const CONTENT: Partial<Record<TileId, Content>> = {
  hours: { Collapsed: HoursCollapsed, Expanded: HoursExpanded },
  food: { Collapsed: FoodCollapsed, Expanded: FoodExpanded },
};

type Props = { def: TileDef; expanded: boolean };

export function Tile({ def, expanded }: Props) {
  if (def.kind === "link") return <LinkLayout def={def} />;
  const content = CONTENT[def.id];
  if (content) {
    return expanded ? <content.Expanded /> : <content.Collapsed />;
  }
  return expanded ? <PlainExpanded def={def} /> : <PlainCollapsed def={def} />;
}

function PlainCollapsed({ def }: { def: TileDef }) {
  return (
    <View style={styles.collapsed}>
      <Text style={styles.collapsedTitle}>{def.title}</Text>
    </View>
  );
}

function LinkLayout({ def }: { def: Extract<TileDef, { kind: "link" }> }) {
  return (
    <View style={styles.collapsed}>
      <Text style={styles.linkIcon}>{def.icon}</Text>
      <Text style={styles.collapsedTitle}>{def.title}</Text>
    </View>
  );
}

function PlainExpanded({ def }: { def: TileDef }) {
  return (
    <ExpandedShell title={def.title}>
      <Text style={styles.expandedBody}>
        Nothing here yet. Swipe down to go back.
      </Text>
    </ExpandedShell>
  );
}

const styles = StyleSheet.create({
  collapsed: { flex: 1, justifyContent: "flex-end", padding: 14 },
  collapsedTitle: { color: "#ffffff", fontSize: 17, fontWeight: "600" },
  linkIcon: { fontSize: 34, marginBottom: 6 },
  expandedBody: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 16,
    marginTop: 12,
  },
});
