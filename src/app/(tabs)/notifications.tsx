import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "@/lib/hooks/useThemeColors";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/lib/hooks/useNotificationsQuery";
import { formatMessageTime } from "@/lib/utils/date";

const NOTIF_ICONS: Record<string, { name: keyof typeof Ionicons.glyphMap; bg: string }> =
  {
    mention: { name: "at-outline", bg: "#DBEAFE" },
    private_message: { name: "mail-outline", bg: "#FFF0E0" },
    room_invitation: { name: "people-outline", bg: "#E0F7EE" },
    system: { name: "information-circle-outline", bg: "#FFE8EC" },
    file_upload: { name: "document-outline", bg: "#DBEAFE" },
  };

function NotificationItem({ notif, onPress }: { notif: any; onPress: () => void }) {
  const colors = useThemeColors();
  const icon = NOTIF_ICONS[notif.notification_type] ?? NOTIF_ICONS.system;
  const isUnread = !notif.is_read;

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-start gap-3 px-5 py-3.5 active:bg-surface-alt ${
        isUnread ? "bg-purple/5" : ""
      }`}
    >
      <View
        className="h-8 w-8 items-center justify-center rounded-xl"
        style={{ backgroundColor: icon.bg }}
      >
        <Ionicons name={icon.name} size={16} color={colors.purple} />
      </View>
      <View className="flex-1">
        <Text
          className={`text-[13px] ${isUnread ? "font-sans-semibold text-ink" : "text-ink"}`}
        >
          {notif.title ?? ""}
        </Text>
        <Text className="mt-0.5 text-[12px] text-ink-3" numberOfLines={2}>
          {notif.content}
        </Text>
        <Text className="mt-1 text-[10px] text-ink-4">
          {formatMessageTime(notif.created_at)}
        </Text>
      </View>
      {isUnread && <View className="mt-1.5 h-2 w-2 rounded-full bg-purple" />}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  const { data: notifications, isLoading, refetch } = useNotifications();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead } = useMarkAllNotificationsRead();

  return (
    <View className="flex-1 bg-cream" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-5 pb-3 pt-3">
        <Text className="text-[26px] font-display-bold tracking-tight text-ink">
          {t("notifications.title")}
        </Text>
        <Pressable
          onPress={() => markAllRead()}
          className="h-[38px] items-center justify-center rounded-xl bg-surface-alt px-3"
        >
          <Text className="text-[12px] font-sans-semibold text-purple">
            {t("notifications.markAllRead")}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.purple}
          />
        }
      >
        {isLoading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color={colors.purple} />
          </View>
        ) : !notifications || notifications.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-purple-light">
              <Ionicons
                name="notifications-off-outline"
                size={28}
                color={colors.purple}
              />
            </View>
            <Text className="text-base font-sans-semibold text-ink">
              {t("notifications.empty")}
            </Text>
          </View>
        ) : Array.isArray(notifications) ? (
          notifications.map((notif: any) => (
            <NotificationItem
              key={notif.id}
              notif={notif}
              onPress={() => markRead(notif.id)}
            />
          ))
        ) : (
          <View className="flex-1 items-center justify-center py-20">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-purple-light">
              <Ionicons
                name="notifications-off-outline"
                size={28}
                color={colors.purple}
              />
            </View>
            <Text className="text-base font-sans-semibold text-ink">
              {t("notifications.empty")}
            </Text>
          </View>
        )}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
