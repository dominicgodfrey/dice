import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AccountProvider } from "../src/account/AccountProvider";
import { initObservability, noteRoute } from "../src/observability";
import { PreferencesProvider } from "../src/preferences/store";
import { colors } from "../src/ui/theme";

// Once per app start, before the first render. No-op without keys.
initObservability();
SplashScreen.preventAutoHideAsync().catch(() => {});

function RouteNotes() {
  const pathname = usePathname();
  useEffect(() => {
    noteRoute(pathname);
  }, [pathname]);
  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const ready = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <PreferencesProvider>
        <AccountProvider>
          <StatusBar style="dark" />
          <RouteNotes />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="(grid)" />
            <Stack.Screen name="edit" options={{ presentation: "modal" }} />
            <Stack.Screen name="search" options={{ presentation: "modal" }} />
            <Stack.Screen name="bug" options={{ presentation: "modal" }} />
            <Stack.Screen name="account" options={{ presentation: "modal" }} />
            <Stack.Screen name="emergency" />
          </Stack>
        </AccountProvider>
      </PreferencesProvider>
    </GestureHandlerRootView>
  );
}
