// Placeholder until Phase 2 builds search (PLAN.md D15).

import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Search() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.title}>Search</Text>
      <Text style={styles.body}>
        Coming in Phase 2: links, rooms, policies, and jumping to a tile.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace("/")
        }
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.buttonText}>Back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#ffffff", paddingHorizontal: 24 },
  title: { fontSize: 30, fontWeight: "700", color: "#111111" },
  body: { marginTop: 8, color: "#666666", fontSize: 15 },
  button: {
    marginTop: 24,
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "#f0f0f0",
  },
  buttonText: { fontSize: 15, fontWeight: "600", color: "#333333" },
});
