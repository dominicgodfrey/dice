// The Links tile (PLAN.md D35): the student's links as a grid of icons
// that resize to fill the tile; each opens its URL. Expanded, every link
// that can sit on the tile, with a toggle.

import { useState } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { usePreferences } from "../../preferences/store";
import { PROMOTABLE, type SearchEntry } from "../../search/entries";
import { Icon } from "../../ui/Icon";
import { Text } from "../../ui/Text";
import { colors, space, type } from "../../ui/theme";
import { CollapsedShell, ExpandedShell, t } from "../shells";
import { iconGrid, linkEntries, toggleLink } from "./links";

const GAP = 8;

function open(e: SearchEntry) {
  if (e.action.kind === "url")
    Linking.openURL(e.action.url.replace("{query}", "")).catch(() => {});
}

export function LinksCollapsed() {
  const { prefs } = usePreferences();
  const links = linkEntries(prefs);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const grid = iconGrid(links.length, box.w, box.h, GAP);
  const showLabels = grid.cell >= 64;
  return (
    <CollapsedShell title="Links" icon="link">
      <View
        style={styles.grid}
        onLayout={(e) =>
          setBox({
            w: e.nativeEvent.layout.width,
            h: e.nativeEvent.layout.height,
          })
        }
      >
        {box.w > 0 &&
          links.map((e) => (
            <Pressable
              key={e.id}
              accessibilityRole="link"
              accessibilityLabel={e.title}
              onPress={() => open(e)}
              style={({ pressed }) => [
                styles.cell,
                { width: grid.cell, height: grid.cell },
                pressed && styles.pressed,
              ]}
            >
              <Icon
                name={e.icon}
                size={Math.min(28, Math.max(16, grid.cell * 0.36))}
                color={colors.onDark}
              />
              {showLabels ? (
                <Text style={styles.cellLabel} numberOfLines={1}>
                  {e.title}
                </Text>
              ) : null}
            </Pressable>
          ))}
      </View>
    </CollapsedShell>
  );
}

export function LinksExpanded() {
  const { prefs, update } = usePreferences();
  const on = new Set(linkEntries(prefs).map((e) => e.id));
  return (
    <ExpandedShell
      title="Links"
      subtitle="Tap a link to open it. Toggle which sit on the tile."
    >
      <View style={styles.list}>
        {PROMOTABLE.map((e) => (
          <View key={e.id} style={styles.item}>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={e.title}
              onPress={() => open(e)}
              style={({ pressed }) => [
                styles.itemMain,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.itemIcon}>
                <Icon name={e.icon} size={18} color={colors.onDark} />
              </View>
              <View style={styles.itemText}>
                <Text style={t.bodyStrong}>{e.title}</Text>
                <Text style={t.muted}>{e.subtitle}</Text>
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: on.has(e.id) }}
              accessibilityLabel={`${e.title} on tile`}
              onPress={() => update((p) => toggleLink(p, e.id))}
              style={({ pressed }) => [
                styles.toggle,
                on.has(e.id) && styles.toggleOn,
                pressed && styles.pressed,
              ]}
            >
              {on.has(e.id) ? (
                <Icon name="check" size={14} color={colors.text} />
              ) : (
                <Icon name="plus" size={14} color={colors.onDark} />
              )}
            </Pressable>
          </View>
        ))}
      </View>
    </ExpandedShell>
  );
}

const styles = StyleSheet.create({
  grid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
    alignContent: "flex-end",
    marginTop: space.sm,
  },
  cell: {
    borderRadius: 12,
    backgroundColor: colors.onDarkFill,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  cellLabel: { ...type.label, color: colors.onDarkMuted, paddingHorizontal: 4 },
  pressed: { opacity: 0.7 },
  list: { marginTop: space.lg },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.onDarkLine,
  },
  itemMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.onDarkFill,
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: { flex: 1 },
  toggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.onDarkFaint,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleOn: { backgroundColor: colors.onDark, borderColor: colors.onDark },
});
