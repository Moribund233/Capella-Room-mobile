/**
 * Root layout: fonts, safe area, auth hydration, React Query and WebSocket.
 */

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import { Caveat_400Regular } from "@expo-google-fonts/caveat";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { DatabaseProvider } from "@nozbe/watermelondb/DatabaseProvider";
import { useAuthStore } from "@/lib/store/auth";
import { useThemeStore } from "@/lib/store/theme";
import { useLanguageStore } from "@/lib/store/language";
import { useWsConnection, useWsEventHandlers } from "@/lib/ws/hooks";
import { queryClient } from "@/lib/hooks/queryClient";
import { database } from "@/lib/db/database";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { NotificationProvider } from "@/components/providers/NotificationProvider";
import "@/global.css";
import "@/lib/i18n";

/**
 * Render the root app layout.
 *
 * @returns A React element.
 */
export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  useLanguageStore((s) => s.locale); // keep store alive for hydration side effects

  const [fontsLoaded] = useFonts({
    Inter: Inter_400Regular,
    InterMedium: Inter_500Medium,
    InterSemiBold: Inter_600SemiBold,
    SpaceGrotesk: SpaceGrotesk_400Regular,
    SpaceGroteskSemiBold: SpaceGrotesk_600SemiBold,
    SpaceGroteskBold: SpaceGrotesk_700Bold,
    Caveat: Caveat_400Regular,
  });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // WebSocket: auto-connect on login, auto-disconnect on logout
  useWsConnection();

  // WebSocket: wire server events → React Query cache + Zustand UI state
  useWsEventHandlers();

  if (isHydrating || !fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <DatabaseProvider database={database}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <NotificationProvider>
              <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
              </Stack>
            </NotificationProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}
