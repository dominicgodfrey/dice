// The long-press menu (PLAN.md D11): a sheet at the bottom with Move, Hide
// and Edit tiles. A scrim behind it closes it.

import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  title: string;
  onMove: () => void;
  onHide: () => void;
  onEdit: () => void;
  onClose: () => void;
};

export function TileMenu({ title, onMove, onHide, onEdit, onClose }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable
        style={[StyleSheet.absoluteFill, styles.scrim]}
        onPress={onClose}
        accessibilityLabel="Close menu"
      />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
        <Text style={styles.title}>{title}</Text>
        <MenuButton label="Move" onPress={onMove} />
        <MenuButton label="Hide" onPress={onHide} />
        <MenuButton label="Edit tiles" onPress={onEdit} />
        <MenuButton label="Cancel" onPress={onClose} muted />
      </View>
    </View>
  );
}

function MenuButton({
  label,
  onPress,
  muted,
}: {
  label: string;
  onPress: () => void;
  muted?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={[styles.label, muted && styles.muted]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrim: { backgroundColor: "rgba(0,0,0,0.3)" },
  sheet: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    maxWidth: 480,
    alignSelf: "center",
    width: "auto",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 12,
    paddingTop: 16,
  },
  title: {
    fontSize: 13,
    color: "#777777",
    fontWeight: "600",
    marginLeft: 8,
    marginBottom: 6,
  },
  button: { paddingVertical: 14, paddingHorizontal: 8, borderRadius: 12 },
  pressed: { backgroundColor: "#f2f2f2" },
  label: { fontSize: 17, color: "#111111" },
  muted: { color: "#888888" },
});
