import { Stack, usePathname } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { initObservability, noteRoute } from "../src/observability";
import { PreferencesProvider } from "../src/preferences/store";

// Once per app start, before the first render. No-op without keys.
initObservability();

function RouteNotes() {
  const pathname = usePathname();
  useEffect(() => {
    noteRoute(pathname);
  }, [pathname]);
  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PreferencesProvider>
        <StatusBar style="dark" />
        <RouteNotes />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(grid)" />
          <Stack.Screen name="edit" options={{ presentation: "modal" }} />
          <Stack.Screen name="search" options={{ presentation: "modal" }} />
          <Stack.Screen name="bug" options={{ presentation: "modal" }} />
          <Stack.Screen name="emergency" />
        </Stack>
      </PreferencesProvider>
    </GestureHandlerRootView>
  );
}
