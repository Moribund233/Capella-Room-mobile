import { useState, useCallback } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useThemeColors } from "@/lib/hooks/useThemeColors";
import { useRecommendedUsers, useSearchUsers } from "@/lib/hooks/useUsersQuery";
import { useRooms, useJoinRoom, useJoinByInvite, useGetOrCreateDirectRoom } from "@/lib/hooks/useRoomsQuery";
import { validateInvite } from "@/lib/api/rooms";
import {
  useFriends,
  useReceivedRequests,
  useSentRequests,
  useSendFriendRequest,
  useHandleFriendRequest,
  useCancelFriendRequest,
  useRemoveFriend,
} from "@/lib/hooks/useFriendsQuery";

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
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<DiscoverTab>("recommended");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: recommendedUsers } = useRecommendedUsers();
  const { data: rooms } = useRooms();
  const { data: friends, isLoading: friendsLoading } = useFriends();
  const { data: receivedRequests, isLoading: requestsLoading } = useReceivedRequests();
  const { data: sentRequests } = useSentRequests();
  const { data: searchResults, isLoading: searching } = useSearchUsers(searchQuery);

  const { mutate: sendFriendReq, isPending: sendingReq } = useSendFriendRequest();
  const { mutate: handleReq, isPending: handlingReq } = useHandleFriendRequest();

  const { mutate: removeFriend, isPending: removingFriend } = useRemoveFriend();
  const { mutate: cancelSentReq, isPending: cancellingSent } = useCancelFriendRequest();
  const { mutate: joinRoom, isPending: joiningRoom } = useJoinRoom();
  const { mutate: joinByInvite, isPending: joiningByInvite } = useJoinByInvite();
  const { mutate: getDirectRoom, isPending: messaging } = useGetOrCreateDirectRoom();
  const [messagingId, setMessagingId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState("");

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleAddFriend = useCallback(
    (userId: string) => {
      sendFriendReq(
        { receiverId: userId },
        {
          onSuccess: () => {
            Alert.alert(t("common.confirm"), t("discover.friendRequestSent"));
          },
          onError: (err: any) => {
            Alert.alert(t("errors.generic"), err?.message ?? t("errors.generic"));
          },
        },
      );
    },
    [sendFriendReq, t],
  );

  const handleJoinRoom = useCallback(
    (roomId: string) => {
      joinRoom(roomId, {
        onSuccess: () => {
          router.push(`/room/${roomId}` as any);
        },
        onError: (err: any) => {
          Alert.alert(t("errors.generic"), err?.message ?? t("discover.joinRoomFailed"));
        },
      });
    },
    [joinRoom, router, t],
  );

  const handleJoinByInvite = useCallback(() => {
    const code = inviteCode.trim();
    if (!code) return;
    validateInvite(code)
      .then((result) => {
        if (!result.valid || !result.room_id) {
          Alert.alert(t("errors.generic"), t("discover.invalidInvite"));
          return;
        }
        joinByInvite(code, {
          onSuccess: () => {
            setInviteCode("");
            router.push(`/room/${result.room_id}` as any);
          },
          onError: (err: any) => {
            Alert.alert(t("errors.generic"), err?.message ?? t("discover.joinRoomFailed"));
          },
        });
      })
      .catch((err: any) => {
        Alert.alert(t("errors.generic"), err?.message ?? t("discover.invalidInvite"));
      });
  }, [inviteCode, joinByInvite, router, t]);

  const handleMessage = useCallback(
    (userId: string) => {
      if (messagingId) return;
      setMessagingId(userId);
      getDirectRoom(userId, {
        onSuccess: (room) => {
          setMessagingId(null);
          router.push(`/room/${room.id}` as any);
        },
        onError: () => {
          setMessagingId(null);
        },
      });
    },
    [getDirectRoom, messagingId, router],
  );

  const handleAcceptRequest = useCallback(
    (requestId: string) => {
      handleReq({ requestId, action: "accept" });
    },
    [handleReq],
  );

  const handleRejectRequest = useCallback(
    (requestId: string) => {
      handleReq({ requestId, action: "reject" });
    },
    [handleReq],
  );

  const handleCancelSentRequest = useCallback(
    (requestId: string) => {
      cancelSentReq(requestId);
    },
    [cancelSentReq],
  );

  const handleRemoveFriend = useCallback(
    (userId: string) => {
      Alert.alert(t("discover.removeFriend"), t("discover.removeFriendConfirm"), [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("common.remove"), style: "destructive", onPress: () => removeFriend(userId) },
      ]);
    },
    [removeFriend, t],
  );

  const requestedUserIds = new Set(
    (sentRequests ?? []).map((r: any) => r.receiver_id).filter(Boolean),
  );

  const friendIds = new Set((friends ?? []).map((f: any) => (f.friend ?? f).id));
  const searchUsersFiltered = (searchResults?.users ?? []).filter(
    (u: any) => !requestedUserIds.has(u.id) && !friendIds.has(u.id),
  );

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
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder={t("discover.searchPlaceholder") ?? "Search people, rooms, topics..."}
            placeholderTextColor={colors.ink4}
            className="ml-2.5 flex-1 text-[13px] text-ink"
            autoCapitalize="none"
            style={{ paddingVertical: 0 }}
          />
          {searching && <ActivityIndicator size="small" color={colors.purple} />}
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

        {/* Invite code */}
        <View className="mx-5 mb-4 rounded-[18px] border border-border-soft bg-surface p-3.5">
          <View className="mb-2 flex-row items-center gap-1.5">
            <Ionicons name="mail-open-outline" size={16} color={colors.ink4} />
            <Text className="text-[13px] font-sans-bold text-ink-2">{t("discover.joinByInvite")}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <TextInput
              value={inviteCode}
              onChangeText={setInviteCode}
              placeholder={t("discover.inviteCodePlaceholder")}
              placeholderTextColor={colors.ink4}
              autoCapitalize="none"
              className="flex-1 rounded-xl border border-border-soft bg-cream px-3 py-2 text-[13px] text-ink"
            />
            <Pressable
              onPress={handleJoinByInvite}
              disabled={joiningByInvite || !inviteCode.trim()}
              className="rounded-xl bg-purple px-4 py-2.5 active:opacity-80 disabled:opacity-50"
            >
              {joiningByInvite ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-[13px] font-sans-semibold text-white">{t("discover.joinByInvite")}</Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* Search results */}
        {searchQuery.trim().length > 0 && searchUsersFiltered.length > 0 && (
          <View className="mb-4 px-5">
            <SectionHeader icon="search-outline" label={t("discover.searchResults")} />
            <View className="rounded-2xl border border-border-soft bg-surface overflow-hidden">
              {searchUsersFiltered.slice(0, 5).map((user: any) => (
                <Pressable
                  key={user.id}
                  className="flex-row items-center gap-3 px-4 py-3 border-b border-border-soft last:border-0 active:bg-surface-alt"
                >
                  <View
                    className="h-9 w-9 items-center justify-center overflow-hidden rounded-xl"
                    style={{ backgroundColor: colors.purpleLight }}
                  >
                    <Text className="text-[13px] font-sans-semibold" style={{ color: colors.purple }}>
                      {user.username?.slice(0, 2).toUpperCase() ?? "?"}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[13px] font-sans-semibold text-ink">{user.username}</Text>
                  </View>
                  <Pressable
                    onPress={() => handleAddFriend(user.id)}
                    disabled={sendingReq}
                    className="rounded-xl bg-purple-light px-3 py-1.5"
                  >
                    <Text className="text-[11px] font-sans-semibold text-purple">
                      {sendingReq ? "..." : t("discover.addFriend")}
                    </Text>
                  </Pressable>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Tab panels */}
        {activeTab === "requests" && (
          <View className="px-5">
            {/* Received requests */}
            <SectionHeader icon="mail-outline" label={t("discover.friendRequests")} />
            {requestsLoading ? (
              <View className="items-center py-8">
                <ActivityIndicator size="small" color={colors.purple} />
              </View>
            ) : (receivedRequests ?? []).length === 0 ? (
              <View className="items-center justify-center py-8">
                <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-purple-light">
                  <Ionicons name="mail-outline" size={24} color={colors.purple} />
                </View>
                <Text className="text-[13px] text-ink-3">{t("discover.noFriendRequests")}</Text>
              </View>
            ) : (
              <View className="rounded-2xl border border-border-soft bg-surface overflow-hidden mb-4">
                {(receivedRequests ?? []).map((req: any) => {
                  const sender = req.sender;
                  return (
                    <View
                      key={req.id}
                      className="flex-row items-center gap-3 px-4 py-3 border-b border-border-soft last:border-0"
                    >
                      <View
                        className="h-9 w-9 items-center justify-center rounded-xl"
                        style={{ backgroundColor: colors.purpleLight }}
                      >
                        <Text className="text-[13px] font-sans-semibold" style={{ color: colors.purple }}>
                          {sender?.username?.slice(0, 2).toUpperCase() ?? "?"}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-[13px] font-sans-semibold text-ink">
                          {sender?.username ?? t("common.unknown")}
                        </Text>
                        {req.message && (
                          <Text className="text-[11px] text-ink-4" numberOfLines={1}>{req.message}</Text>
                        )}
                      </View>
                      <View className="flex-row gap-1.5">
                        <Pressable
                          onPress={() => handleRejectRequest(req.id)}
                          disabled={handlingReq}
                          className="rounded-xl border border-border-soft px-3 py-1.5"
                        >
                          <Text className="text-[11px] font-sans-semibold text-ink-3">{t("discover.decline")}</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => handleAcceptRequest(req.id)}
                          disabled={handlingReq}
                          className="rounded-xl bg-purple px-3 py-1.5"
                        >
                          <Text className="text-[11px] font-sans-semibold text-white">{t("discover.accept")}</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Sent requests */}
            {(sentRequests ?? []).length > 0 && (
              <>
                <SectionHeader icon="paper-plane-outline" label={t("discover.sentRequests")} />
                <View className="rounded-2xl border border-border-soft bg-surface overflow-hidden">
                  {(sentRequests ?? []).map((req: any) => {
                    const receiverId = req.receiver_id;
                    return (
                      <View
                        key={req.id}
                        className="flex-row items-center gap-3 px-4 py-3 border-b border-border-soft last:border-0"
                      >
                        <View
                          className="h-9 w-9 items-center justify-center rounded-xl"
                          style={{ backgroundColor: colors.amberLight }}
                        >
                          <Text className="text-[13px] font-sans-semibold" style={{ color: colors.amberText }}>
                            {receiverId?.slice(0, 2).toUpperCase() ?? "?"}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-[13px] font-sans-semibold text-ink">
                            {t("common.pending")}
                          </Text>
                          {req.message && (
                            <Text className="text-[11px] text-ink-4" numberOfLines={1}>{req.message}</Text>
                          )}
                        </View>
                        <Pressable
                          onPress={() => handleCancelSentRequest(req.id)}
                          disabled={cancellingSent}
                          className="rounded-xl border border-rose/30 px-3 py-1.5"
                        >
                          <Text className="text-[11px] font-sans-semibold text-rose">{t("common.cancel")}</Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        )}

        {activeTab === "recommended" && (
          <View>
            <SectionHeader icon="star-outline" label={t("discover.recommendedPeople")} />
            <View className="flex-row flex-wrap gap-[10px] px-5">
              {(recommendedUsers ?? []).slice(0, 6).map((user: any) => {
                const alreadyRequested = requestedUserIds.has(user.id);
                const isFriend = (friends ?? []).some((f: any) => (f.friend ?? f).id === user.id);
                return (
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
                          <Text className="text-[9px] font-sans-semibold text-mint-text">{t("common.online")}</Text>
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
                    <Pressable
                      onPress={() => {
                        if (isFriend) {
                          handleMessage(user.id);
                        } else if (!alreadyRequested) {
                          handleAddFriend(user.id);
                        }
                      }}
                      disabled={sendingReq || alreadyRequested || messagingId === user.id}
                      className={`w-full rounded-xl py-1.5 ${
                        isFriend
                          ? "bg-purple-light"
                          : alreadyRequested
                            ? "bg-amber-light"
                            : "bg-purple-light"
                      }`}
                    >
                      <Text className="text-center text-[11px] font-sans-semibold"
                        style={{
                          color: isFriend ? colors.purple : alreadyRequested ? colors.amberText : colors.purple,
                        }}
                      >
                        {isFriend
                          ? messagingId === user.id
                            ? "..."
                            : t("discover.message")
                          : alreadyRequested
                            ? t("discover.sent")
                            : t("discover.addFriend")}
                      </Text>
                    </Pressable>
                  </Pressable>
                );
              })}
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
                  onPress={() => handleJoinRoom(room.id)}
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
                        {room.member_count ?? 0} {t("common.members")}
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
                    <Pressable
                      onPress={() => handleJoinRoom(room.id)}
                      disabled={joiningRoom}
                      className="rounded-xl bg-purple-light px-4 py-1.5"
                    >
                      <Text className="text-[11px] font-sans-semibold text-purple">
                        {joiningRoom ? "..." : t("discover.joinRoom")}
                      </Text>
                    </Pressable>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {activeTab === "friends" && (
          <View className="px-5">
            <SectionHeader icon="people-outline" label={t("discover.tabs.friends")} />
            {friendsLoading ? (
              <View className="items-center py-8">
                <ActivityIndicator size="small" color={colors.purple} />
              </View>
            ) : (friends ?? []).length === 0 ? (
              <View className="items-center justify-center py-12">
                <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-purple-light">
                  <Ionicons name="people-outline" size={28} color={colors.purple} />
                </View>
                <Text className="text-[13px] text-ink-3">{t("discover.noFriends")}</Text>
              </View>
            ) : (
              <View className="rounded-2xl border border-border-soft bg-surface overflow-hidden">
                {(friends ?? []).map((friend: any) => {
                const friendInfo = friend.friend ?? friend;
                return (
                  <Pressable
                    key={friend.id}
                    className="flex-row items-center gap-3 px-4 py-3 border-b border-border-soft last:border-0 active:bg-surface-alt"
                  >
                    <View className="relative">
                      <View
                        className="h-9 w-9 items-center justify-center overflow-hidden rounded-xl"
                        style={{ backgroundColor: colors.purpleLight }}
                      >
                        <Text className="text-[13px] font-sans-semibold" style={{ color: colors.purple }}>
                          {friendInfo.username?.slice(0, 2).toUpperCase() ?? "?"}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-1">
                      <Text className="text-[13px] font-sans-semibold text-ink">{friendInfo.username}</Text>
                    </View>
                    <Pressable
                      onPress={() => handleMessage(friendInfo.id)}
                      disabled={messaging || messagingId === friendInfo.id}
                      className="mr-1 rounded-xl bg-purple-light px-3 py-1.5"
                    >
                      {messagingId === friendInfo.id ? (
                        <ActivityIndicator size="small" color={colors.purple} />
                      ) : (
                        <Text className="text-[11px] font-sans-semibold text-purple">{t("discover.message")}</Text>
                      )}
                    </Pressable>
                    <Pressable
                      onPress={() => handleRemoveFriend(friendInfo.id)}
                      disabled={removingFriend}
                      className="rounded-xl px-2.5 py-1 border border-border-soft"
                    >
                      <Ionicons name="person-remove-outline" size={14} color={colors.ink3} />
                    </Pressable>
                  </Pressable>
                );
              })}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
