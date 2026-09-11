// Colour picker for a tile (PLAN.md D36): the palette as swatches.

import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../ui/Icon";
import { Text } from "../ui/Text";
import {
  colors,
  PALETTE_KEYS,
  palette,
  space,
  type PaletteKey,
} from "../ui/theme";
import { sheetStyles } from "./TileMenu";

type Props = {
  title: string;
  current: PaletteKey;
  onPick: (key: PaletteKey) => void;
  onClose: () => void;
};

export function ColorSheet({ title, current, onPick, onClose }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable
        style={[StyleSheet.absoluteFill, sheetStyles.scrim]}
        onPress={onClose}
        accessibilityLabel="Close"
      />
      <View
        style={[sheetStyles.sheet, { paddingBottom: insets.bottom + space.lg }]}
      >
        <Text style={sheetStyles.title}>{title} colour</Text>
        <View style={styles.swatches}>
          {PALETTE_KEYS.map((key) => {
            const on = key === current;
            return (
              <Pressable
                key={key}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={palette[key].name}
                onPress={() => onPick(key)}
                style={({ pressed }) => [
                  styles.swatchWrap,
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.swatch,
                    { backgroundColor: palette[key].color },
                    on && styles.swatchOn,
                  ]}
                >
                  {on ? (
                    <Icon name="check" size={18} color={colors.onDark} />
                  ) : null}
                </View>
                <Text style={styles.name}>{palette[key].name}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  swatches: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.md,
    paddingHorizontal: space.sm,
    paddingTop: space.xs,
  },
  swatchWrap: { alignItems: "center", gap: 6, width: 64 },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  swatchOn: { borderWidth: 3, borderColor: colors.text },
  name: { fontSize: 12, lineHeight: 16, color: colors.muted },
  pressed: { opacity: 0.7 },
});
