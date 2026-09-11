// The ambient header (PLAN.md D17, layer 1): a quiet band whose colour
// follows the sun over campus, with the date and the time-of-day arc.

import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { skyFor, sunAltitude } from "../sky/sun";
import { Text } from "../ui/Text";
import { space, type } from "../ui/theme";
import { DayArc } from "./DayArc";

const TICK_MS = 60_000;

export function Header() {
  const insets = useSafeAreaInsets();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const sky = skyFor(sunAltitude(now));
  const fg = sky.dark ? "#FFFFFF" : "#101828";
  const dim = sky.dark ? "rgba(255,255,255,0.72)" : "rgba(16,24,40,0.62)";
  const date = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <LinearGradient
      colors={[sky.top, sky.bottom]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.band, { paddingTop: insets.top + space.lg }]}
    >
      <View style={styles.inner}>
        <Text style={[styles.brand, { color: dim }]}>Dice</Text>
        <Text style={[styles.date, { color: fg }]}>{date}</Text>
        <DayArc now={now} label={sky.label} fg={fg} dim={dim} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  band: { width: "100%", paddingBottom: space.xl, paddingHorizontal: space.lg },
  inner: { width: "100%", maxWidth: 1200, alignSelf: "center" },
  brand: { ...type.small, fontWeight: "600" },
  date: {
    ...type.display,
    fontWeight: "600",
    letterSpacing: -0.3,
    marginTop: 2,
  },
});
