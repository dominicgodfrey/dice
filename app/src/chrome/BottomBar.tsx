// The fixed bottom bar (PLAN.md D13): the search pill and, beside it with a
// visible gap, the round red emergency button. Tap only, no gestures, at
// least 44pt, labelled.

import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function BottomBar() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={[styles.bar, { paddingBottom: insets.bottom + 12 }]}
    >
      <Pressable
        accessibilityRole="search"
        accessibilityLabel="Search"
        onPress={() => router.push("/search")}
        style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
      >
        <Text style={styles.pillText}>Search Dice</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Emergency"
        onPress={() => router.push("/emergency")}
        style={({ pressed }) => [styles.sos, pressed && styles.pressed]}
      >
        <Text style={styles.sosText}>SOS</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    gap: 14,
  },
  pill: {
    flexGrow: 1,
    maxWidth: 520,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    paddingHorizontal: 22,
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  pillText: { fontSize: 16, color: "#666666" },
  sos: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#D7263D",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  sosText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 1,
  },
  pressed: { opacity: 0.85 },
});
