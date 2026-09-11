// Shell for the static pages (PLAN.md D22): back, title, prose.

import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function Page({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.screen}
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
      <Text style={styles.title}>{title}</Text>
      {children}
    </ScrollView>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <Text style={styles.p}>{children}</Text>;
}

export function H({ children }: { children: ReactNode }) {
  return <Text style={styles.h}>{children}</Text>;
}

export function A({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Text
      accessibilityRole="link"
      style={styles.a}
      onPress={() => Linking.openURL(href).catch(() => {})}
    >
      {children}
    </Text>
  );
}

export function Spacer() {
  return <View style={styles.spacer} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#ffffff" },
  content: {
    paddingHorizontal: 20,
    maxWidth: 640,
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
  pressed: { opacity: 0.7 },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 12,
  },
  h: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111111",
    marginTop: 20,
    marginBottom: 6,
  },
  p: { fontSize: 16, lineHeight: 24, color: "#333333", marginBottom: 12 },
  a: { color: "#2255aa", textDecorationLine: "underline" },
  spacer: { height: 12 },
});
