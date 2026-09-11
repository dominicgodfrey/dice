// The tile gallery (PLAN.md D11): every tile, shown or hidden, with a tap to
// toggle; and which links sit on the Links tile (D35). Onboarding opens
// this so a new student picks what they care about.

import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { hideTile, showTile } from "../src/grid/order";
import { usePreferences } from "../src/preferences/store";
import { PROMOTABLE } from "../src/search/entries";
import { linkEntries, toggleLink } from "../src/tiles/links/links";
import { TILES, tileColor } from "../src/tiles/registry";
import { Icon } from "../src/ui/Icon";
import { Text } from "../src/ui/Text";
import { colors, radius, space, type } from "../src/ui/theme";

export default function EditTiles() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { prefs, update } = usePreferences();
  const hidden = new Set(prefs.hidden);
  const links = new Set(linkEntries(prefs).map((e) => e.id));

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + space.xl,
            paddingBottom: insets.bottom + 96,
          },
        ]}
      >
        <Text style={styles.title}>Your tiles</Text>
        <Text style={styles.subtitle}>
          Pick what you want on your home screen. Long-press a tile there to
          move it, change its colour, or hide it.
        </Text>
        <View style={styles.card}>
          {TILES.map((t, i) => {
            const shown = !hidden.has(t.id);
            return (
              <Pressable
                key={t.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: shown }}
                accessibilityLabel={t.title}
                onPress={() =>
                  update((p) =>
                    shown ? hideTile(p, t.id) : showTile(p, t.id, TILES),
                  )
                }
                style={({ pressed }) => [
                  styles.row,
                  i > 0 && styles.rowBorder,
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.swatch,
                    { backgroundColor: tileColor(prefs, t) },
                  ]}
                >
                  <Icon name={t.icon} size={16} color={colors.onDark} />
                </View>
                <Text style={styles.rowTitle}>{t.title}</Text>
                <Check on={shown} />
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.section}>On the Links tile</Text>
        <Text style={styles.subtitle}>
          Any of these can sit on the Links tile as a one-tap icon. You can also
          add one from a search result.
        </Text>
        <View style={styles.card}>
          {PROMOTABLE.map((e, i) => {
            const on = links.has(e.id);
            return (
              <Pressable
                key={e.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={e.title}
                onPress={() => update((p) => toggleLink(p, e.id))}
                style={({ pressed }) => [
                  styles.row,
                  i > 0 && styles.rowBorder,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.swatchNeutral}>
                  <Icon name={e.icon} size={16} color={colors.text} />
                </View>
                <Text style={styles.rowTitle}>{e.title}</Text>
                <Check on={on} />
              </Pressable>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            update({ order: [], hidden: [], promoted: [], colors: {} })
          }
          style={({ pressed }) => [styles.reset, pressed && styles.pressed]}
        >
          <Text style={styles.resetText}>Reset layout and colours</Text>
        </Pressable>
      </ScrollView>
      <View
        style={[styles.footer, { paddingBottom: insets.bottom + space.lg }]}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
          style={({ pressed }) => [styles.done, pressed && styles.pressed]}
        >
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Check({ on }: { on: boolean }) {
  return (
    <View style={[styles.check, on && styles.checkOn]}>
      {on ? <Icon name="check" size={14} color={colors.onDark} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: space.xl,
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
  },
  title: { ...type.display, fontWeight: "600", letterSpacing: -0.3 },
  subtitle: {
    ...type.body,
    color: colors.muted,
    marginTop: 6,
    marginBottom: space.lg,
  },
  section: { ...type.heading, fontWeight: "600", marginTop: space.xxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: space.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: space.md,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  pressed: { opacity: 0.6 },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  swatchNeutral: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { ...type.body, flex: 1 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkOn: { backgroundColor: colors.text, borderColor: colors.text },
  reset: { marginTop: space.xl, alignSelf: "flex-start", paddingVertical: 10 },
  resetText: { ...type.body, color: colors.danger },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    backgroundColor: colors.bg,
    alignItems: "center",
  },
  done: {
    width: "100%",
    maxWidth: 520,
    height: 50,
    borderRadius: radius.control,
    backgroundColor: colors.text,
    alignItems: "center",
    justifyContent: "center",
  },
  doneText: { ...type.body, color: colors.onDark, fontWeight: "600" },
});
