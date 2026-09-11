// Text in Inter. A style's fontWeight picks the static face, so callers
// write `fontWeight: "600"` as usual and get Inter SemiBold everywhere.

import { StyleSheet, Text as RNText, type TextProps } from "react-native";
import { colors, font } from "./theme";

export function Text({ style, ...rest }: TextProps) {
  const flat = StyleSheet.flatten(style) ?? {};
  const w = String(flat.fontWeight ?? "400");
  const family =
    w === "700" || w === "bold" || w === "800" || w === "900"
      ? font.bold
      : w === "600"
        ? font.semibold
        : w === "500"
          ? font.medium
          : font.regular;
  return (
    <RNText
      {...rest}
      style={[
        { color: colors.text },
        style,
        { fontFamily: family, fontWeight: undefined },
      ]}
    />
  );
}
