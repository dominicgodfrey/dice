// The emergency page (PLAN.md D14): a real route, big buttons, each one
// confirming "you are about to call X" before it dials. Share my location
// composes a text to Public Safety with a maps link; nothing touches a
// backend.

import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EMERGENCY, type EmergencyContact } from "../src/fixtures/emergency";

type Located = { lat: number; lon: number };

export default function Emergency() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [pending, setPending] = useState<EmergencyContact | null>(null);
  const [located, setLocated] = useState<Located | "working" | "denied" | null>(
    null,
  );

  const dial = (c: EmergencyContact) => {
    setPending(null);
    Linking.openURL(`tel:${c.number}`).catch(() => {});
  };

  const locate = async () => {
    setLocated("working");
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") return setLocated("denied");
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocated({ lat: pos.coords.latitude, lon: pos.coords.longitude });
    } catch {
      setLocated("denied");
    }
  };

  const mapsLink = (l: Located) =>
    `https://maps.google.com/?q=${l.lat.toFixed(5)},${l.lon.toFixed(5)}`;

  const sendLocation = (l: Located) => {
    const body = encodeURIComponent(`I need help. My location: ${mapsLink(l)}`);
    const sep = Platform.OS === "ios" ? "&" : "?";
    Linking.openURL(`sms:${EMERGENCY.smsTo}${sep}body=${body}`).catch(() => {});
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Emergency</Text>
        <Text style={styles.lead}>
          Tap a number. You will see who you are about to call before it dials.
        </Text>

        {EMERGENCY.contacts.map((c) => (
          <Pressable
            key={c.id}
            accessibilityRole="button"
            accessibilityLabel={`Call ${c.name}`}
            onPress={() => setPending(c)}
            style={({ pressed }) => [
              styles.contact,
              c.urgent ? styles.urgent : styles.calm,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.contactName, c.urgent && styles.onRed]}>
              {c.name}
            </Text>
            <Text style={[styles.contactDetail, c.urgent && styles.onRed]}>
              {c.detail}
            </Text>
            <Text style={[styles.contactNumber, c.urgent && styles.onRed]}>
              {c.display}
            </Text>
          </Pressable>
        ))}

        <Text style={styles.section}>Share my location</Text>
        <Text style={styles.body}>
          Sends a text to Public Safety with a map link to where you are. Your
          location is used only to write that message.
        </Text>
        {located === null || located === "denied" ? (
          <Pressable
            accessibilityRole="button"
            onPress={locate}
            style={({ pressed }) => [
              styles.contact,
              styles.calm,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.contactName}>Find my location</Text>
            {located === "denied" ? (
              <Text style={styles.contactDetail}>
                Location was not available. Check the permission and try again.
              </Text>
            ) : null}
          </Pressable>
        ) : located === "working" ? (
          <Text style={styles.body}>Finding you…</Text>
        ) : (
          <View>
            <Text selectable style={styles.link}>
              {mapsLink(located)}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => sendLocation(located)}
              style={({ pressed }) => [
                styles.contact,
                styles.urgent,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.contactName, styles.onRed]}>
                Text it to Public Safety
              </Text>
              <Text style={[styles.contactDetail, styles.onRed]}>
                Opens your messages app with the link filled in
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {pending ? (
        <View style={StyleSheet.absoluteFill}>
          <Pressable
            style={[StyleSheet.absoluteFill, styles.scrim]}
            onPress={() => setPending(null)}
          />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.sheetTitle}>You are about to call</Text>
            <Text style={styles.sheetName}>{pending.name}</Text>
            <Text style={styles.sheetNumber}>{pending.display}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => dial(pending)}
              style={({ pressed }) => [
                styles.callButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.callText}>Call</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setPending(null)}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const RED = "#D7263D";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#ffffff" },
  content: {
    paddingHorizontal: 20,
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
  },
  back: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingRight: 12,
    marginBottom: 8,
  },
  backText: { fontSize: 16, color: "#555555" },
  title: { fontSize: 34, fontWeight: "800", color: RED },
  lead: {
    marginTop: 6,
    marginBottom: 18,
    fontSize: 16,
    color: "#333333",
    lineHeight: 22,
  },
  contact: { borderRadius: 18, padding: 18, marginBottom: 12 },
  urgent: { backgroundColor: RED },
  calm: { backgroundColor: "#f2f2f2" },
  onRed: { color: "#ffffff" },
  contactName: { fontSize: 20, fontWeight: "700", color: "#111111" },
  contactDetail: { marginTop: 4, fontSize: 14, color: "#555555" },
  contactNumber: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#111111",
  },
  section: { marginTop: 24, fontSize: 20, fontWeight: "700", color: "#111111" },
  body: {
    marginTop: 6,
    marginBottom: 12,
    fontSize: 15,
    color: "#444444",
    lineHeight: 21,
  },
  link: { fontSize: 14, color: "#2255aa", marginBottom: 12 },
  pressed: { opacity: 0.85 },
  scrim: { backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    maxWidth: 480,
    alignSelf: "center",
    width: "auto",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
  },
  sheetTitle: { fontSize: 14, color: "#777777" },
  sheetName: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: "700",
    color: "#111111",
  },
  sheetNumber: {
    marginTop: 2,
    fontSize: 18,
    color: "#333333",
    marginBottom: 18,
  },
  callButton: {
    width: "100%",
    height: 56,
    borderRadius: 28,
    backgroundColor: RED,
    alignItems: "center",
    justifyContent: "center",
  },
  callText: { color: "#ffffff", fontSize: 18, fontWeight: "700" },
  cancelButton: { marginTop: 8, paddingVertical: 12, paddingHorizontal: 24 },
  cancelText: { fontSize: 16, color: "#555555" },
});
