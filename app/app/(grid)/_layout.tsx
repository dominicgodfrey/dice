// The grid is the layout; "/" and "/[tile]" are its children and render
// nothing themselves. An expanded tile is a route (PLAN.md D29), and the
// ExpandProvider animates it in and out as the route changes.

import { Slot } from "expo-router";
import { StyleSheet, View } from "react-native";
import { ExpandProvider } from "../../src/expand/ExpandProvider";
import { Grid } from "../../src/grid/Grid";

export default function GridLayout() {
  return (
    <View style={styles.screen}>
      <ExpandProvider>
        <Grid />
        <Slot />
      </ExpandProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#ffffff" },
});
