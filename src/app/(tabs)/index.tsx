import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter, type Href } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useRecentRooms } from "@/lib/hooks/useRoomsQuery";
import { useAllRoomSettings } from "@/lib/hooks/useSettingsQuery";
import { useFriends } from "@/lib/hooks/useFriendsQuery";
import { useUnreadCount } from "@/lib/hooks/useNotificationsQuery";
import { useAuthStore } from "@/lib/store/auth";
import { formatMessageTime } from "@/lib/utils/date";
import { useThemeColors } from "@/lib/hooks/useThemeColors";
import type { Room, LastMessage } from "@/lib/api/rooms";
import type { User } from "@/lib/api/users";

const AVATAR_COLORS = [
  ["#2563EB", "#60A5FA"],
  ["#F4A261", "#F6AD55"],
  ["#5EC4A0", "#68D391"],
  ["#E8788A", "#F687B3"],
  ["#2563EB", "#3B82F6"],
  ["#E8B44A", "#F6E05E"],
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const palette = AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  return palette[0];
}

function Avatar({
  name,
  emoji,
  size = 44,
  online,
  away,
  busy,
}: {
  name?: string;
  emoji?: string | null;
  size?: number;
  online?: boolean;
  away?: boolean;
  busy?: boolean;
}) {
  const initial = name?.slice(0, 2).toUpperCase() ?? "?";
  const bg = emoji ? undefined : getAvatarColor(name ?? "?");
  const borderRadius = size * 0.32;
  const dotSize = size * 0.27;
  const dotBorder = dotSize * 0.2;

  return (
    <View
      className="relative items-center justify-center overflow-hidden"
      style={{ width: size, height: size, borderRadius, backgroundColor: bg ?? undefined }}
    >
      {emoji ? (
        <Text style={{ fontSize: size * 0.45 }}>{emoji}</Text>
      ) : (
        <Text
          className="font-sans-semibold text-white"
          style={{ fontSize: size * 0.3 }}
        >
          {initial}
        </Text>
      )}
      {(online || away || busy) && (
        <View
          className="absolute rounded-full"
          style={{
            width: dotSize,
            height: dotSize,
            borderWidth: dotBorder,
            borderColor: "#F7F9FC",
            backgroundColor: busy ? "#E8788A" : away ? "#F4A261" : "#5EC4A0",
            bottom: -1,
            right: -1,
          }}
        />
      )}
    </View>
  );
}

function Header({ unreadNotifications }: { unreadNotifications?: number }) {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <View className="flex-row items-center justify-between px-5 pb-3 pt-1">
      <Text className="text-[26px] font-display-bold tracking-tight text-ink">
        {t("home.title")}
      </Text>
      <View className="flex-row items-center gap-1.5">
        <Pressable
          onPress={() => router.push("/(tabs)/discover" as Href)}
          className="h-[38px] w-[38px] items-center justify-center rounded-xl bg-surface-alt"
          style={{ backgroundColor: colors.surfaceAlt }}
        >
          <Ionicons name="people-outline" size={20} color={colors.ink2} />
          {!!unreadNotifications && unreadNotifications > 0 && (
            <View className="absolute right-[6px] top-[6px] h-2 w-2 rounded-full bg-rose" />
          )}
        </Pressable>
        <Pressable
          className="h-[38px] w-[38px] items-center justify-center rounded-xl bg-surface-alt"
          style={{ backgroundColor: colors.surfaceAlt }}
        >
          <Ionicons name="search-outline" size={20} color={colors.ink2} />
        </Pressable>
      </View>
    </View>
  );
}

function SearchBar({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (text: string) => void;
}) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  return (
    <View className="mx-5 mb-4">
      <View
        className="flex-row items-center rounded-[14px] border px-4 py-[11px]"
        style={{ borderColor: colors.borderSoft, backgroundColor: colors.surface }}
      >
        <Ionicons name="search" size={16} color={colors.ink4} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={t("home.searchPlaceholder")}
          placeholderTextColor={colors.ink4}
          className="ml-2.5 flex-1 text-[13px] text-ink"
          autoCapitalize="none"
          style={{ paddingVertical: 0 }}
        />
      </View>
    </View>
  );
}

function OnlineFriendsStrip({ friends }: { friends?: User[] }) {
  const router = useRouter();
  const onlineFriends = useMemo(
    () => (friends ?? []).filter((f) => f.status === "online").slice(0, 10),
    [friends],
  );

  if (!onlineFriends.length) return null;

  return (
    <View className="mb-4 px-5">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 14 }}
      >
        {onlineFriends.map((friend) => (
          <Pressable
            key={friend.id}
            onPress={() => router.push(`/room/${friend.id}` as Href)}
            className="items-center"
          >
            <Avatar
              name={friend.username}
              emoji={friend.avatar_url}
              size={44}
              online
            />
            <Text
              className="mt-1.5 max-w-[48px] text-[10px] text-ink-3"
              numberOfLines={1}
            >
              {friend.username}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function getRoomDisplayName(room: Room): string {
  if (room.name) return room.name;
  return "Untitled";
}

function getMessagePreview(lastMessage: LastMessage | null | undefined, currentUserId?: string): string {
  if (!lastMessage) return "";
  const isMe = currentUserId ? lastMessage.sender_name === currentUserId : false;
  const prefix = isMe ? "You:" : `${lastMessage.sender_name}:`;
  return `${prefix} ${lastMessage.content}`;
}

function ConversationItem({
  room,
  pinned,
}: {
  room: Room;
  pinned?: boolean;
}) {
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const displayName = getRoomDisplayName(room);
  const preview = getMessagePreview(room.last_message, currentUserId);
  const time = room.last_message ? formatMessageTime(room.last_message.created_at) : "";
  const unread = room.unread_count ?? 0;

  return (
    <Pressable
      onPress={() => router.push(`/room/${room.id}` as Href)}
      className={`flex-row items-center gap-3 rounded-2xl px-3 py-3 active:scale-[0.98] active:bg-surface-alt ${
        unread > 0 ? "bg-purple/5" : ""
      }`}
    >
      <Avatar name={displayName} size={44} />
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="flex-1 text-[14px] font-sans-semibold text-ink" numberOfLines={1}>
            {displayName}
          </Text>
          {!!time && <Text className="ml-2 text-[11px] text-ink-4">{time}</Text>}
        </View>
        <View className="mt-0.5 flex-row items-center">
          {pinned && <Ionicons name="pin" size={12} color="#F4A261" style={{ marginRight: 2 }} />}
          <Text
            className={`flex-1 text-[12.5px] ${
              unread > 0 ? "font-sans-medium text-ink" : "text-ink-3"
            }`}
            numberOfLines={1}
          >
            {preview || "No messages yet"}
          </Text>
        </View>
        <View className="mt-0.5 flex-row items-center">
          <Text className="text-[10px] text-ink-4">
            {room.member_count > 2 ? `${room.member_count} members` : ""}
            {pinned && room.member_count > 2 ? " · " : ""}
            {pinned && room.member_count <= 2 ? `${room.member_count} members` : ""}
          </Text>
        </View>
      </View>
      {unread > 0 && (
        <View className="absolute bottom-[14px] right-3 h-[18px] min-w-[18px] items-center justify-center rounded-full px-[5px]"
          style={{ backgroundColor: pinned ? "#94A3B8" : "#2563EB" }}
        >
          <Text className="text-[10px] font-sans-bold text-white">
            {unread > 99 ? "99+" : unread}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-purple-light">
        <Ionicons name="chatbubbles-outline" size={28} color={colors.purple} />
      </View>
      <Text className="text-lg font-sans-semibold text-ink">{t("home.noConversations")}</Text>
      <Text className="mt-1 text-center text-sm text-ink-3">{t("home.emptyHint")}</Text>
      <Pressable
        onPress={onRefresh}
        className="mt-4 rounded-full bg-purple px-5 py-2.5 shadow-md"
      >
        <Text className="text-sm font-sans-semibold text-white">{t("common.retry")}</Text>
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [search, setSearch] = useState("");

  const {
    data: rooms,
    isLoading: roomsLoading,
    error: roomsError,
    refetch: refetchRooms,
  } = useRecentRooms(50);
  const { data: roomSettings, refetch: refetchSettings } = useAllRoomSettings();
  const { data: friends } = useFriends();
  const { data: unreadCount } = useUnreadCount();

  const pinnedRoomIds = useMemo(
    () => new Set((roomSettings ?? []).filter((s) => s.pinned).map((s) => s.room_id)),
    [roomSettings],
  );

  const filteredRooms = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rooms ?? [];
    return (rooms ?? []).filter((room) =>
      getRoomDisplayName(room).toLowerCase().includes(term),
    );
  }, [rooms, search]);

  const pinnedRooms = useMemo(
    () => filteredRooms.filter((room) => pinnedRoomIds.has(room.id)),
    [filteredRooms, pinnedRoomIds],
  );
  const recentRooms = useMemo(
    () => filteredRooms.filter((room) => !pinnedRoomIds.has(room.id)),
    [filteredRooms, pinnedRoomIds],
  );

  const isLoading = roomsLoading;
  const hasError = !!roomsError;
  const isEmpty = !isLoading && !hasError && filteredRooms.length === 0;

  const handleRefresh = () => {
    refetchRooms();
    refetchSettings();
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator size="large" color={colors.purple} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-cream" style={{ paddingTop: insets.top }}>
      <Header unreadNotifications={unreadCount?.count} />
      <SearchBar value={search} onChangeText={setSearch} />
      <OnlineFriendsStrip friends={friends} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={roomsLoading}
            onRefresh={handleRefresh}
            tintColor={colors.purple}
          />
        }
      >
        {hasError && (
          <View className="mx-5 mb-4 rounded-2xl bg-rose-light p-4">
            <Text className="text-sm text-rose-text">{t("errors.generic")}</Text>
            <Pressable
              onPress={handleRefresh}
              className="mt-2 self-start rounded-full bg-rose px-4 py-1.5"
            >
              <Text className="text-xs font-sans-semibold text-white">{t("common.retry")}</Text>
            </Pressable>
          </View>
        )}

        {isEmpty ? (
          <EmptyState onRefresh={handleRefresh} />
        ) : (
          <>
            {pinnedRooms.length > 0 && (
              <View className="mb-1">
                <View className="mb-2.5 flex-row items-center justify-between px-5">
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="pin" size={14} color="#94A3B8" />
                    <Text className="text-[13px] font-sans-bold text-ink-2">
                      {t("home.pinned")}
                    </Text>
                  </View>
                </View>
                <View className="px-3">
                  {pinnedRooms.map((room) => (
                    <ConversationItem key={room.id} room={room} pinned />
                  ))}
                </View>
              </View>
            )}

            {recentRooms.length > 0 && (
              <View className="mb-4">
                <View className="mb-2.5 flex-row items-center justify-between px-5">
                  <Text className="text-[13px] font-sans-bold text-ink-2">{t("home.recent")}</Text>
                  <Text className="text-[12px] font-sans-semibold text-purple">{t("common.seeAll")}</Text>
                </View>
                <View className="px-3">
                  {recentRooms.map((room) => (
                    <ConversationItem key={room.id} room={room} />
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
