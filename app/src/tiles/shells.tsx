// The two frames every tile's content sits in: the collapsed square with an
// icon and a small title at the top, and the expanded page with grabber,
// title, source line, and a scroll that cooperates with swipe-to-close.

import type { ReactNode } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useExpandedScroll } from "../expand/ExpandProvider";
import type { GestureType } from "react-native-gesture-handler";
import { WIDE_BREAKPOINT } from "../grid/layout";
import { Icon, type IconName } from "../ui/Icon";
import { Text } from "../ui/Text";
import { colors, space, type } from "../ui/theme";

export function CollapsedShell({
  title,
  icon,
  children,
}: {
  title: string;
  icon: IconName;
  children: ReactNode;
}) {
  return (
    <View style={styles.collapsed}>
      <View style={styles.collapsedHead}>
        <Icon name={icon} size={15} color={colors.onDarkMuted} />
        <Text style={styles.collapsedTitle}>{title}</Text>
      </View>
      <View style={styles.collapsedBody}>{children}</View>
    </View>
  );
}

export function ExpandedShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const fillsScreen = width <= WIDE_BREAKPOINT;
  const { onScroll, gesture } = useExpandedScroll();
  return (
    <View
      style={[
        styles.expanded,
        { paddingTop: (fillsScreen ? insets.top : 0) + 10 },
      ]}
    >
      <View style={styles.grabber} />
      <GestureDetector gesture={gesture}>
        <Animated.ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          bounces={false}
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: (fillsScreen ? insets.bottom : 0) + space.xxl },
          ]}
        >
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          {children}
        </Animated.ScrollView>
      </GestureDetector>
    </View>
  );
}

/** The card's swipe-to-close pan, for content whose own drag must win over it. */
export function useClosePan(): GestureType {
  return useExpandedScroll().closePan;
}

/** A labelled section inside an expanded view. */
export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

/** A row of a table: left label, right value. */
export function Row({
  left,
  right,
  strong,
  rightColor,
}: {
  left: string;
  right: string;
  strong?: boolean;
  rightColor?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLeft, strong && styles.strong]} numberOfLines={1}>
        {left}
      </Text>
      <Text
        style={[
          styles.rowRight,
          strong && styles.strong,
          rightColor ? { color: rightColor } : null,
        ]}
        numberOfLines={1}
      >
        {right}
      </Text>
    </View>
  );
}

/** A pill button on a dark tile. */
export function TileButton({
  label,
  onPress,
  icon,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
}) {
  return (
    <Text
      accessibilityRole="button"
      onPress={onPress}
      style={styles.button}
      suppressHighlighting
    >
      {icon ? <Icon name={icon} size={13} color={colors.onDark} /> : null}
      {icon ? "  " : ""}
      {label}
    </Text>
  );
}

/** Text styles for tile content, all on the dark tile ground. */
export const t = StyleSheet.create({
  stat: {
    ...type.stat,
    color: colors.onDark,
    fontWeight: "600",
    letterSpacing: -0.5,
  },
  heading: { ...type.heading, color: colors.onDark, fontWeight: "600" },
  body: { ...type.body, color: colors.onDark },
  bodyStrong: { ...type.body, color: colors.onDark, fontWeight: "600" },
  muted: { ...type.small, color: colors.onDarkMuted },
  small: { ...type.small, color: colors.onDark },
  label: { ...type.label, color: colors.onDarkMuted, fontWeight: "500" },
});

const styles = StyleSheet.create({
  collapsed: { flex: 1, padding: space.lg },
  collapsedHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  collapsedTitle: {
    ...type.small,
    color: colors.onDarkMuted,
    fontWeight: "500",
  },
  collapsedBody: { flex: 1, justifyContent: "flex-end" },
  expanded: { flex: 1 },
  grabber: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.onDarkFaint,
    marginBottom: 6,
  },
  scroll: { paddingHorizontal: space.xl, paddingTop: space.md },
  title: {
    ...type.display,
    color: colors.onDark,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  subtitle: { ...type.small, color: colors.onDarkMuted, marginTop: 2 },
  section: { marginTop: space.xl },
  sectionTitle: {
    ...type.small,
    color: colors.onDarkMuted,
    fontWeight: "500",
    marginBottom: space.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.onDarkLine,
    gap: space.md,
  },
  rowLeft: { ...type.body, color: colors.onDark, flex: 1 },
  rowRight: { ...type.body, color: colors.onDarkMuted },
  strong: { fontWeight: "600", color: colors.onDark },
  button: {
    ...type.small,
    color: colors.onDark,
    fontWeight: "600",
    alignSelf: "flex-start",
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.onDarkFill,
    overflow: "hidden",
    marginTop: space.md,
  },
});
