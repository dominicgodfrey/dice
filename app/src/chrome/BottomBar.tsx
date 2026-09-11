// The fixed bottom bar (PLAN.md D13): the search field and, beside it with a
// visible gap, the round red emergency button. Tap only, labelled, 44pt+.

import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../ui/Icon";
import { Text } from "../ui/Text";
import { colors, space, type } from "../ui/theme";

export function BottomBar() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={[styles.bar, { paddingBottom: insets.bottom + space.md }]}
    >
      <Pressable
        accessibilityRole="search"
        accessibilityLabel="Search"
        onPress={() => router.push("/search")}
        style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
      >
        <Icon name="search" size={18} color={colors.muted} />
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
    paddingHorizontal: space.lg,
    gap: space.md,
  },
  pill: {
    flexGrow: 1,
    maxWidth: 520,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  pillText: { ...type.body, color: colors.muted },
  sos: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  sosText: {
    ...type.small,
    color: colors.onDark,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  pressed: { opacity: 0.85 },
});
