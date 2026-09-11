// One tile component, two layouts chosen by `expanded` (PLAN.md D9). Phase 1
// ships the plain coloured square; real content per tile arrives in Phase 4.

import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WIDE_BREAKPOINT } from "../grid/layout";
import type { TileDef } from "./registry";

type Props = { def: TileDef; expanded: boolean };

export function Tile({ def, expanded }: Props) {
  return expanded ? (
    <ExpandedLayout def={def} />
  ) : (
    <CollapsedLayout def={def} />
  );
}

function CollapsedLayout({ def }: { def: TileDef }) {
  return (
    <View style={styles.collapsed}>
      <Text style={styles.collapsedTitle}>{def.title}</Text>
    </View>
  );
}

function ExpandedLayout({ def }: { def: TileDef }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const fillsScreen = width <= WIDE_BREAKPOINT;
  return (
    <View
      style={[
        styles.expanded,
        {
          paddingTop: (fillsScreen ? insets.top : 0) + 24,
          paddingBottom: (fillsScreen ? insets.bottom : 0) + 24,
        },
      ]}
    >
      <View style={styles.grabber} />
      <Text style={styles.expandedTitle}>{def.title}</Text>
      <Text style={styles.expandedBody}>
        Nothing here yet. Swipe down to go back.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  collapsed: { flex: 1, justifyContent: "flex-end", padding: 14 },
  collapsedTitle: { color: "#ffffff", fontSize: 17, fontWeight: "600" },
  expanded: { flex: 1, paddingHorizontal: 24 },
  grabber: {
    alignSelf: "center",
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
    marginBottom: 20,
  },
  expandedTitle: { color: "#ffffff", fontSize: 34, fontWeight: "700" },
  expandedBody: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 16,
    marginTop: 12,
  },
});
