// Placeholder until Phase 2 builds the emergency page (PLAN.md D14): the
// route exists now so the bottom bar's button goes somewhere real.

import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Emergency() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.title}>Emergency</Text>
      <Text style={styles.body}>
        In an emergency call 911. Confirmed one-tap dials for BEMCo, Public
        Safety and counselling arrive in Phase 2.
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
  title: { fontSize: 30, fontWeight: "700", color: "#D7263D" },
  body: { marginTop: 8, color: "#333333", fontSize: 16, lineHeight: 23 },
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
