/**
 * Push notification provider.
 *
 * Registers for push notifications, requests permissions, captures the Expo
 * push token and routes the user to the correct room when a notification is
 * tapped.
 */

import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { useAuthStore } from "@/lib/store/auth";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request push notification permissions and return the Expo push token.
 *
 * @returns The push token string, or null if permissions are denied.
 */
async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenData.data;
}

/**
 * Provide push notification setup and tap handling.
 *
 * @returns A React element.
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);
  const setPushToken = useAuthStore((s) => s.setPushToken);
  const notificationListenerRef = useRef<Notifications.EventSubscription | null>(null);
  const responseListenerRef = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setPushToken(token);
        // TODO: send token to backend once a device/push-token endpoint exists.
        console.log("Expo push token:", token);
      }
    });

    notificationListenerRef.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log("Notification received:", notification.request.content.data);
    });

    responseListenerRef.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { room_id?: string } | undefined;
      if (data?.room_id) {
        router.push(`/room/${data.room_id}` as any);
      }
    });

    return () => {
      notificationListenerRef.current?.remove();
      responseListenerRef.current?.remove();
      notificationListenerRef.current = null;
      responseListenerRef.current = null;
    };
  }, [isAuthenticated, router, setPushToken]);

  return <>{children}</>;
}
