import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "../lib/store/auth";
import { useWsConnection, useWsEventHandlers } from "../lib/ws/hooks";
import { queryClient } from "../lib/hooks/queryClient";
import "../global.css";

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrating = useAuthStore((s) => s.isHydrating);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // WebSocket: auto-connect on login, auto-disconnect on logout
  useWsConnection();

  // WebSocket: wire server events → React Query cache + Zustand UI state
  useWsEventHandlers();

  if (isHydrating) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F7F9FC]">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </QueryClientProvider>
  );
}
