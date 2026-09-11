// The ambient header (PLAN.md D17, layer 1): a quiet band whose colour
// follows the sun over campus, with the date and today's sunrise and sunset.

import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { skyFor, sunAltitude, sunTimes } from "../sky/sun";
import { Text } from "../ui/Text";
import { space, type } from "../ui/theme";

const TICK_MS = 60_000;

function formatTime(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function Header() {
  const insets = useSafeAreaInsets();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const sky = skyFor(sunAltitude(now));
  const { sunrise, sunset } = sunTimes(now);
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
        <Text style={[styles.sun, { color: dim }]}>
          {sky.label} · Sunrise {formatTime(sunrise)} · Sunset{" "}
          {formatTime(sunset)}
        </Text>
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
  sun: { ...type.small, marginTop: 4 },
});
