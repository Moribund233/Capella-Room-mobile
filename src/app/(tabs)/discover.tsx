import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "@/lib/hooks/useThemeColors";
import { useRecommendedUsers } from "@/lib/hooks/useUsersQuery";
import { useRooms } from "@/lib/hooks/useRoomsQuery";
import { useFriends, useReceivedRequests } from "@/lib/hooks/useFriendsQuery";

type DiscoverTab = "recommended" | "friends" | "requests" | "rooms";

function SubTab({
  label,
  active,
  onPress,
  badge,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  badge?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-full border-0 font-sans-semibold"
      style={{
        paddingVertical: 7,
        paddingHorizontal: 16,
        backgroundColor: active ? "#2563EB" : "#F1F5F9",
      }}
    >
      <View className="flex-row items-center gap-1">
        <Text
          className="text-[12px] font-sans-semibold"
          style={{ color: active ? "white" : "#94A3B8" }}
        >
          {label}
        </Text>
        {badge !== undefined && (
          <View
            className="min-w-[16px] h-4 items-center justify-center rounded-full px-1"
            style={{ backgroundColor: active ? "rgba(255,255,255,0.25)" : "#DBEAFE" }}
          >
            <Text
              className="text-[9px] font-sans-bold"
              style={{ color: active ? "white" : "#2563EB" }}
            >
              {badge}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function SectionHeader({ icon, label }: { icon: string; label: string }) {
  const colors = useThemeColors();
  return (
    <View className="mb-3 flex-row items-center gap-1.5 px-5">
      <Ionicons name={icon as any} size={16} color={colors.ink4} />
      <Text className="text-[13px] font-sans-bold text-ink-2">{label}</Text>
    </View>
  );
}

export default function DiscoverScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  const [activeTab, setActiveTab] = useState<DiscoverTab>("recommended");

  const { data: recommendedUsers } = useRecommendedUsers();
  const { data: rooms } = useRooms();
  const { data: friends } = useFriends();
  const { data: receivedRequests } = useReceivedRequests();

  return (
    <View className="flex-1 bg-cream" style={{ paddingTop: insets.top + 12 }}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Header */}
        <View className="mb-4 px-5">
          <Text className="font-display-bold text-[26px] tracking-tight text-ink">
            {t("discover.title")}
          </Text>
          <Text className="mt-0.5 text-[13px] text-ink-3">{t("discover.subtitle")}</Text>
        </View>

        {/* Search bar */}
        <View
          className="mx-5 mb-4 flex-row items-center rounded-[14px] border px-4 py-[11px]"
          style={{ borderColor: colors.borderSoft, backgroundColor: colors.surface }}
        >
          <Ionicons name="search" size={16} color={colors.ink4} />
          <TextInput
            placeholder={t("discover.searchPlaceholder") ?? "Search people, rooms, topics..."}
            placeholderTextColor={colors.ink4}
            className="ml-2.5 flex-1 text-[13px] text-ink"
            autoCapitalize="none"
            style={{ paddingVertical: 0 }}
          />
        </View>

        {/* Sub-tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 4, alignItems: "center" }}
          className="mb-4"
        >
          <SubTab
            label={t("discover.tabs.recommended")}
            active={activeTab === "recommended"}
            onPress={() => setActiveTab("recommended")}
          />
          <SubTab
            label={t("discover.tabs.friends")}
            active={activeTab === "friends"}
            onPress={() => setActiveTab("friends")}
            badge={friends?.length}
          />
          <SubTab
            label={t("discover.tabs.requests")}
            active={activeTab === "requests"}
            onPress={() => setActiveTab("requests")}
            badge={receivedRequests?.length}
          />
          <SubTab
            label={t("discover.tabs.rooms")}
            active={activeTab === "rooms"}
            onPress={() => setActiveTab("rooms")}
          />
        </ScrollView>

        {/* Tab panels */}
        {activeTab === "requests" && (
          <View className="px-5">
            <SectionHeader icon="mail-outline" label={t("discover.friendRequests")} />
            <View className="items-center justify-center py-12">
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-purple-light">
                <Ionicons name="mail-outline" size={28} color={colors.purple} />
              </View>
              <Text className="text-[13px] text-ink-3">{t("discover.noFriendRequests")}</Text>
            </View>
          </View>
        )}

        {activeTab === "recommended" && (
          <View>
            <SectionHeader icon="star-outline" label={t("discover.recommendedPeople")} />
            <View className="flex-row flex-wrap gap-[10px] px-5">
              {(recommendedUsers ?? []).slice(0, 6).map((user: any) => (
                <Pressable
                  key={user.id}
                  className="rounded-[18px] border border-border-soft bg-surface p-3.5 active:scale-[0.97]"
                  style={{ width: "47.5%" }}
                >
                  <View className="mb-2 flex-row items-start justify-between">
                    <View
                      className="h-10 w-10 items-center justify-center overflow-hidden rounded-xl"
                      style={{ backgroundColor: colors.purpleLight }}
                    >
                      <Text className="text-[16px] font-sans-semibold" style={{ color: colors.purple }}>
                        {user.username?.slice(0, 2).toUpperCase() ?? "?"}
                      </Text>
                    </View>
                    {user.status === "online" && (
                      <View className="rounded-md bg-mint-light px-1.5 py-0.5">
                        <Text className="text-[9px] font-sans-semibold text-mint-text">Online</Text>
                      </View>
                    )}
                  </View>
                  <Text className="mb-0.5 text-[13px] font-sans-semibold text-ink">{user.username}</Text>
                  <Text
                    className="mb-2.5 text-[10.5px] leading-[1.4] text-ink-3"
                    numberOfLines={2}
                  >
                    {user.bio ?? ""}
                  </Text>
                  <Pressable className="w-full rounded-xl bg-purple-light py-1.5">
                    <Text className="text-center text-[11px] font-sans-semibold text-purple">
                      + Add Friend
                    </Text>
                  </Pressable>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {activeTab === "rooms" && (
          <View>
            <View className="mb-3 flex-row items-center justify-between px-5">
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="chatbubbles-outline" size={16} color={colors.ink4} />
                <Text className="text-[13px] font-sans-bold text-ink-2">{t("discover.popularRooms")}</Text>
              </View>
              <Text className="text-[12px] font-sans-semibold text-purple">{t("common.explore")}</Text>
            </View>
            <View className="px-5">
              {(rooms ?? []).slice(0, 10).map((room: any) => (
                <Pressable
                  key={room.id}
                  className="mb-2.5 rounded-[18px] border border-border-soft bg-surface p-3.5 active:scale-[0.98]"
                >
                  <View className="mb-2 flex-row items-center gap-2.5">
                    <View
                      className="h-[42px] w-[42px] items-center justify-center rounded-xl"
                      style={{ backgroundColor: colors.purpleLight }}
                    >
                      <Ionicons name="chatbubbles-outline" size={22} color={colors.purple} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[14px] font-sans-semibold text-ink">{room.name}</Text>
                      <Text className="text-[11px] text-ink-3">
                        {room.member_count ?? 0} members
                      </Text>
                    </View>
                  </View>
                  {room.description && (
                    <Text className="mb-2.5 text-[12px] leading-[1.45] text-ink-3" numberOfLines={2}>
                      {room.description}
                    </Text>
                  )}
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row">
                      {(room.recent_members ?? []).slice(0, 3).map((m: any, i: number) => (
                        <View
                          key={m.id ?? i}
                          className="-ml-1.5 h-[22px] w-[22px] items-center justify-center overflow-hidden rounded-full border-2 border-white first:ml-0"
                          style={{ backgroundColor: colors.purpleLight }}
                        >
                          <Text className="text-[8px] font-sans-semibold" style={{ color: colors.purple }}>
                            {m.username?.slice(0, 1) ?? "?"}
                          </Text>
                        </View>
                      ))}
                    </View>
                    <Pressable className="rounded-xl bg-purple-light px-4 py-1.5">
                      <Text className="text-[11px] font-sans-semibold text-purple">Join</Text>
                    </Pressable>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {activeTab === "friends" && (
          <View className="items-center justify-center px-5 py-16">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-purple-light">
              <Ionicons name="people-outline" size={28} color={colors.purple} />
            </View>
            <Text className="text-base font-sans-semibold text-ink">Friends</Text>
            <Text className="mt-1 text-sm text-ink-3">Coming soon</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
