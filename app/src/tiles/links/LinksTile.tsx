// The Links tile (PLAN.md D35, D46): the student's links as icons that fill
// the tile, every icon the same size, whatever shape the packer gave the
// tile: a row, the tail of a row, or an L. Each opens its URL. Expanded,
// every link that can sit on the tile, with a toggle.

import { useState } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import type { Shape } from "../../grid/layout";
import { usePreferences } from "../../preferences/store";
import { PROMOTABLE, type SearchEntry } from "../../search/entries";
import { Icon } from "../../ui/Icon";
import { Text } from "../../ui/Text";
import { colors, space, type } from "../../ui/theme";
import {
  CollapsedHead,
  CollapsedShell,
  ExpandedShell,
  t,
  Watermark,
} from "../shells";
import { layoutIcons, linkEntries, toggleLink } from "./links";

const GAP = 8;
/** The collapsed header row plus the gap under it. */
const HEAD_HEIGHT = 22 + space.sm;

function open(e: SearchEntry) {
  if (e.action.kind === "url")
    Linking.openURL(e.action.url.replace("{query}", "")).catch(() => {});
}

function LinkIcons({ links, size }: { links: SearchEntry[]; size: number }) {
  const showLabels = size >= 64;
  return (
    <View style={styles.icons} pointerEvents="box-none">
      {links.map((e) => (
        <Pressable
          key={e.id}
          accessibilityRole="link"
          accessibilityLabel={e.title}
          onPress={() => open(e)}
          style={({ pressed }) => [
            styles.cell,
            { width: size, height: size },
            pressed && styles.pressed,
          ]}
        >
          <Icon
            name={e.icon}
            size={Math.min(28, Math.max(16, size * 0.36))}
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
  );
}

/** The tile drawn box by box: the header in the first, icons in all. */
function ShapedLinks({ links, shape }: { links: SearchEntry[]; shape: Shape }) {
  const pad = space.lg;
  const boxes = shape.boxes.map((c, i) => ({
    w: c.width - pad * 2,
    h: c.height - pad * 2 - (i === 0 ? HEAD_HEIGHT : 0),
  }));
  const { size, counts } = layoutIcons(links.length, boxes, GAP);
  const slices: SearchEntry[][] = [];
  let start = 0;
  for (const n of counts) {
    slices.push(links.slice(start, start + n));
    start += n;
  }
  return (
    <>
      {shape.boxes.map((c, i) => {
        return (
          <View
            key={i}
            pointerEvents="box-none"
            style={[
              styles.cellBox,
              { left: c.x, top: c.y, width: c.width, height: c.height },
            ]}
          >
            {i === 0 ? (
              <>
                <Watermark icon="link" />
                <CollapsedHead title="Links" icon="link" />
              </>
            ) : null}
            <View
              style={[styles.iconsArea, i === 0 && styles.iconsTop]}
              pointerEvents="box-none"
            >
              <LinkIcons links={slices[i]} size={size} />
            </View>
          </View>
        );
      })}
    </>
  );
}

export function LinksCollapsed({ shape }: { shape?: Shape }) {
  const { prefs } = usePreferences();
  const links = linkEntries(prefs);
  const [box, setBox] = useState({ w: 0, h: 0 });
  if (shape) return <ShapedLinks links={links} shape={shape} />;
  const { size } = layoutIcons(links.length, [box], GAP);
  return (
    <CollapsedShell title="Links" icon="link">
      <View
        style={styles.iconsArea}
        onLayout={(e) =>
          setBox({
            w: e.nativeEvent.layout.width,
            h: e.nativeEvent.layout.height,
          })
        }
      >
        {box.w > 0 ? <LinkIcons links={links} size={size} /> : null}
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
  cellBox: { position: "absolute", padding: space.lg },
  iconsArea: { flex: 1, justifyContent: "flex-end", marginTop: space.sm },
  iconsTop: { justifyContent: "flex-start" },
  icons: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
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
