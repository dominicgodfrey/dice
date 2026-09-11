// Shell for the static pages (PLAN.md D22): back, title, prose.

import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../ui/Icon";
import { Text } from "../ui/Text";
import { colors, radius, space, type } from "../ui/theme";

export function BackButton({ label = "Back" }: { label?: string }) {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      style={({ pressed }) => [styles.back, pressed && styles.pressed]}
    >
      <Icon name="chevron-left" size={18} color={colors.muted} />
      <Text style={styles.backText}>{label}</Text>
    </Pressable>
  );
}

export function Page({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + space.md,
          paddingBottom: insets.bottom + space.xxl,
        },
      ]}
    >
      <BackButton />
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

/** A primary button for pages. */
export function Button({
  label,
  onPress,
  danger,
  disabled,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        danger && styles.buttonDanger,
        disabled && styles.buttonDisabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

export const pageStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: space.xl,
    maxWidth: 640,
    width: "100%",
    alignSelf: "center",
  },
  title: {
    ...type.display,
    fontWeight: "600",
    letterSpacing: -0.3,
    marginBottom: space.md,
  },
  lead: { ...type.body, color: colors.muted, marginBottom: space.lg },
  input: {
    ...type.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.control,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: space.md,
    fontFamily: "Inter_400Regular",
  },
});

const styles = StyleSheet.create({
  ...pageStyles,
  back: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingRight: 12,
    marginBottom: space.sm,
    marginLeft: -4,
  },
  backText: { ...type.body, color: colors.muted },
  pressed: { opacity: 0.7 },
  h: {
    ...type.heading,
    fontWeight: "600",
    marginTop: space.xl,
    marginBottom: 6,
  },
  p: { ...type.body, color: "#333333", marginBottom: space.md },
  a: { color: colors.accent, textDecorationLine: "underline" },
  spacer: { height: space.md },
  button: {
    height: 50,
    borderRadius: radius.control,
    backgroundColor: colors.text,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.xl,
  },
  buttonDanger: { backgroundColor: colors.danger },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { ...type.body, color: colors.onDark, fontWeight: "600" },
});
