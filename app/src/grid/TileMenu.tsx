// The long-press menu (PLAN.md D11, D36): a sheet with Move, Colour, Hide
// and Edit tiles. A scrim behind it closes it.

import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, type IconName } from "../ui/Icon";
import { Text } from "../ui/Text";
import { colors, radius, space, type } from "../ui/theme";

type Props = {
  title: string;
  onMove: () => void;
  onColor: () => void;
  onHide: () => void;
  onEdit: () => void;
  onClose: () => void;
};

export function TileMenu({
  title,
  onMove,
  onColor,
  onHide,
  onEdit,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable
        style={[StyleSheet.absoluteFill, styles.scrim]}
        onPress={onClose}
        accessibilityLabel="Close menu"
      />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + space.md }]}>
        <Text style={styles.title}>{title}</Text>
        <MenuButton icon="move" label="Move" onPress={onMove} />
        <MenuButton icon="edit-2" label="Colour" onPress={onColor} />
        <MenuButton icon="eye-off" label="Hide" onPress={onHide} />
        <MenuButton icon="sliders" label="Edit tiles" onPress={onEdit} />
        <MenuButton icon="x" label="Cancel" onPress={onClose} muted />
      </View>
    </View>
  );
}

function MenuButton({
  icon,
  label,
  onPress,
  muted,
}: {
  icon: IconName;
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
      <Icon name={icon} size={18} color={muted ? colors.muted : colors.text} />
      <Text style={[styles.label, muted && styles.muted]}>{label}</Text>
    </Pressable>
  );
}

export const sheetStyles = StyleSheet.create({
  scrim: { backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
    position: "absolute",
    left: space.md,
    right: space.md,
    bottom: space.md,
    maxWidth: 480,
    alignSelf: "center",
    width: "auto",
    backgroundColor: colors.surface,
    borderRadius: radius.tile,
    padding: space.md,
    paddingTop: space.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  title: {
    ...type.small,
    color: colors.muted,
    fontWeight: "500",
    marginLeft: space.sm,
    marginBottom: space.sm,
  },
});

const styles = StyleSheet.create({
  ...sheetStyles,
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingVertical: 13,
    paddingHorizontal: space.sm,
    borderRadius: radius.control,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  label: { ...type.body, color: colors.text, fontWeight: "500" },
  muted: { color: colors.muted },
});
