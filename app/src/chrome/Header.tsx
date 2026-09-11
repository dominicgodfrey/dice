// The ambient header (PLAN.md D17, layer 1): a sky-coloured band that
// follows the sun over campus, with today's sunrise and sunset.

import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { skyFor, sunAltitude, sunTimes } from "../sky/sun";

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
  const fg = sky.dark ? "#FFFFFF" : "#0F1B33";
  const dim = sky.dark ? "rgba(255,255,255,0.75)" : "rgba(15,27,51,0.7)";
  const date = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <LinearGradient
      colors={[sky.top, sky.bottom]}
      style={[styles.band, { paddingTop: insets.top + 18 }]}
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
  band: { width: "100%", paddingBottom: 22, paddingHorizontal: 16 },
  inner: { width: "100%", maxWidth: 1200, alignSelf: "center" },
  brand: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  date: { marginTop: 4, fontSize: 26, fontWeight: "700" },
  sun: { marginTop: 4, fontSize: 14 },
});
