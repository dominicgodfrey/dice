// The two frames every live tile's content sits in: the collapsed square
// with a small title, and the expanded page with grabber, title, source
// line and a scroll that cooperates with the swipe-to-close gesture.

import type { ReactNode } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useExpandedScroll } from "../expand/ExpandProvider";
import { WIDE_BREAKPOINT } from "../grid/layout";

export function CollapsedShell({
  title,
  fg = "#ffffff",
  children,
}: {
  title: string;
  fg?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.collapsed}>
      <Text style={[styles.collapsedTitle, { color: fg }]}>{title}</Text>
      <View style={styles.collapsedBody}>{children}</View>
    </View>
  );
}

export function ExpandedShell({
  title,
  subtitle,
  fg = "#ffffff",
  children,
}: {
  title: string;
  subtitle?: string;
  fg?: string;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const fillsScreen = width <= WIDE_BREAKPOINT;
  const { onScroll, gesture } = useExpandedScroll();
  const dim = fg === "#ffffff" ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.55)";
  return (
    <View
      style={[
        styles.expanded,
        { paddingTop: (fillsScreen ? insets.top : 0) + 12 },
      ]}
    >
      <View style={[styles.grabber, { backgroundColor: dim }]} />
      <GestureDetector gesture={gesture}>
        <Animated.ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          bounces={false}
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: (fillsScreen ? insets.bottom : 0) + 32 },
          ]}
        >
          <Text style={[styles.title, { color: fg }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: dim }]}>{subtitle}</Text>
          ) : null}
          {children}
        </Animated.ScrollView>
      </GestureDetector>
    </View>
  );
}

/** A labelled section inside an expanded view. */
export function Section({
  title,
  fg = "#ffffff",
  children,
}: {
  title: string;
  fg?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: fg }]}>{title}</Text>
      {children}
    </View>
  );
}

/** A row of a table: left label, right value. */
export function Row({
  left,
  right,
  fg = "#ffffff",
  strong,
}: {
  left: string;
  right: string;
  fg?: string;
  strong?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text
        style={[styles.rowLeft, { color: fg }, strong && styles.strong]}
        numberOfLines={1}
      >
        {left}
      </Text>
      <Text style={[styles.rowRight, { color: fg }]} numberOfLines={1}>
        {right}
      </Text>
    </View>
  );
}

export const shellStyles = StyleSheet.create({
  line: { fontSize: 15, lineHeight: 21 },
  small: { fontSize: 13, lineHeight: 18 },
  big: { fontSize: 22, fontWeight: "700" },
});

const styles = StyleSheet.create({
  collapsed: { flex: 1, padding: 14 },
  collapsedTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    opacity: 0.85,
  },
  collapsedBody: { flex: 1, justifyContent: "flex-end" },
  expanded: { flex: 1 },
  grabber: {
    alignSelf: "center",
    width: 36,
    height: 5,
    borderRadius: 3,
    marginBottom: 4,
  },
  scroll: { paddingHorizontal: 24, paddingTop: 12 },
  title: { fontSize: 34, fontWeight: "700" },
  subtitle: { marginTop: 4, fontSize: 14 },
  section: { marginTop: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    opacity: 0.8,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.25)",
    gap: 12,
  },
  rowLeft: { flex: 1, fontSize: 15 },
  rowRight: { fontSize: 15, opacity: 0.9 },
  strong: { fontWeight: "700" },
});
