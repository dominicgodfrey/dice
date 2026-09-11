// The tile gallery (PLAN.md D11): every tile, shown or hidden, with a tap to
// toggle. Onboarding opens this so a new student picks what they care about.

import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { hideTile, showTile } from "../src/grid/order";
import { usePreferences } from "../src/preferences/store";
import { TILES } from "../src/tiles/registry";

export default function EditTiles() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { prefs, update } = usePreferences();
  const hidden = new Set(prefs.hidden);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 96 },
        ]}
      >
        <Text style={styles.title}>Your tiles</Text>
        <Text style={styles.subtitle}>
          Pick what you want on your home screen. Long-press a tile there to
          move or hide it.
        </Text>
        {TILES.map((t) => {
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
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <View style={[styles.swatch, { backgroundColor: t.color }]} />
              <Text style={styles.rowTitle}>{t.title}</Text>
              <Text style={[styles.state, shown && styles.stateOn]}>
                {shown ? "Shown" : "Hidden"}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="button"
          onPress={() => update({ order: [], hidden: [] })}
          style={({ pressed }) => [styles.reset, pressed && styles.pressed]}
        >
          <Text style={styles.resetText}>Reset layout</Text>
        </Pressable>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#ffffff" },
  content: {
    paddingHorizontal: 20,
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
  },
  title: { fontSize: 30, fontWeight: "700", color: "#111111" },
  subtitle: {
    marginTop: 8,
    marginBottom: 20,
    color: "#666666",
    fontSize: 15,
    lineHeight: 21,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 14,
  },
  pressed: { backgroundColor: "#f4f4f4" },
  swatch: { width: 36, height: 36, borderRadius: 10 },
  rowTitle: { flex: 1, fontSize: 17, color: "#111111" },
  state: { fontSize: 14, color: "#999999" },
  stateOn: { color: "#2b7a3d", fontWeight: "600" },
  reset: {
    marginTop: 24,
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  resetText: { color: "#b23a3a", fontSize: 15 },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: "#ffffff",
    alignItems: "center",
  },
  done: {
    width: "100%",
    maxWidth: 520,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },
  doneText: { color: "#ffffff", fontSize: 17, fontWeight: "600" },
});
