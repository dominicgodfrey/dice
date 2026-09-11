// Feather icons, one size and stroke everywhere.

import { Feather } from "@expo/vector-icons";
import { colors } from "./theme";

export type IconName = keyof typeof Feather.glyphMap;

export function Icon({
  name,
  size = 18,
  color = colors.text,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return <Feather name={name} size={size} color={color} />;
}
