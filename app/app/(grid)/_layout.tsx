// The grid is the layout; "/" and "/[tile]" are its children and render
// nothing themselves. An expanded tile is a route (PLAN.md D29), and the
// ExpandProvider animates it in and out as the route changes. The first
// launch opens the tile gallery (D11).

import { Slot, useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { BottomBar } from "../../src/chrome/BottomBar";
import { ExpandProvider } from "../../src/expand/ExpandProvider";
import { Grid } from "../../src/grid/Grid";
import { usePreferences } from "../../src/preferences/store";
import { SourcesProvider } from "../../src/sources/SourcesProvider";

export default function GridLayout() {
  const router = useRouter();
  const { prefs, loaded, update } = usePreferences();

  useEffect(() => {
    if (!loaded || prefs.onboarded) return;
    update({ onboarded: true });
    router.push("/edit");
  }, [loaded, prefs.onboarded, update, router]);

  return (
    <View style={styles.screen}>
      <SourcesProvider>
        <ExpandProvider>
          <Grid />
          <BottomBar />
          <Slot />
        </ExpandProvider>
      </SourcesProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#ffffff" },
});
