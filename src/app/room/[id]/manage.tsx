import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  Clipboard,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "@/lib/hooks/useThemeColors";
import { useAuthStore } from "@/lib/store/auth";
import {
  useRoom,
  useRoomMembers,
  useRoomInvitations,
  useUpdateRoom,
  useDeleteRoom,
  useLeaveRoom,
  useKickMember,
  useSetMemberRole,
  useCreateInvitation,
  useDeleteInvitation,
} from "@/lib/hooks/useRoomsQuery";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useThemeColors();
  return (
    <View className="mb-4 px-5">
      <Text
        className="mb-2 px-1 text-[11px] font-sans-bold uppercase tracking-wider"
        style={{ color: colors.ink4 }}
      >
        {title}
      </Text>
      <View className="overflow-hidden rounded-2xl border border-border-soft bg-surface">
        {children}
      </View>
    </View>
  );
}

function Row({
  label,
  value,
  icon,
  onPress,
  destructive,
  last,
  loading,
}: {
  label: string;
  value?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  destructive?: boolean;
  last?: boolean;
  loading?: boolean;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className={`flex-row items-center gap-3 px-4 py-3.5 ${last ? "" : "border-b border-border-soft"}`}
    >
      {icon && (
        <View
          className="h-8 w-8 items-center justify-center rounded-xl"
          style={{ backgroundColor: colors.surfaceAlt }}
        >
          <Ionicons name={icon} size={16} color={destructive ? colors.rose : colors.ink2} />
        </View>
      )}
      <View className="flex-1">
        <Text className={`text-[14px] font-sans-medium ${destructive ? "text-rose" : "text-ink"}`}>
          {label}
        </Text>
      </View>
      {value && <Text className="text-[13px] text-ink-3">{value}</Text>}
      {loading ? (
        <ActivityIndicator size="small" color={colors.ink4} />
      ) : (
        onPress && <Ionicons name="chevron-forward" size={16} color={colors.ink4} />
      )}
    </Pressable>
  );
}

export default function RoomManageScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { id: roomId } = useLocalSearchParams<{ id: string }>();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const { data: room, isLoading: roomLoading } = useRoom(roomId ?? "");
  const { data: members, isLoading: membersLoading } = useRoomMembers(roomId ?? "");
  const { data: invitations, isLoading: invitationsLoading } = useRoomInvitations(roomId ?? "");

  const { mutate: updateRoom, isPending: updatingRoom } = useUpdateRoom();
  const { mutate: deleteRoom, isPending: deletingRoom } = useDeleteRoom();
  const { mutate: leaveRoom, isPending: leavingRoom } = useLeaveRoom();
  const { mutate: kickMember, isPending: kicking } = useKickMember();
  const { mutate: setMemberRole, isPending: settingRole } = useSetMemberRole();
  const { mutate: createInvitation, isPending: creatingInvite } = useCreateInvitation();
  const { mutate: deleteInvitation, isPending: deletingInvite } = useDeleteInvitation();

  const [editingInfo, setEditingInfo] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrivate, setEditPrivate] = useState(false);

  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteExpires, setInviteExpires] = useState("");
  const [inviteMaxUses, setInviteMaxUses] = useState("");

  const myMembership = useMemo(
    () => members?.find((m) => m.user_id === currentUserId),
    [members, currentUserId],
  );
  const isOwner = myMembership?.role === "owner";
  const canManage = isOwner || myMembership?.role === "admin";

  const startEdit = useCallback(() => {
    setEditName(room?.name ?? "");
    setEditDescription(room?.description ?? "");
    setEditPrivate(room?.is_private ?? false);
    setEditingInfo(true);
  }, [room]);

  const saveRoomInfo = useCallback(() => {
    if (!roomId || !editName.trim()) return;
    updateRoom(
      {
        roomId,
        payload: {
          name: editName.trim(),
          description: editDescription.trim() || undefined,
          is_private: editPrivate,
        },
      },
      {
        onSuccess: () => setEditingInfo(false),
      },
    );
  }, [roomId, editName, editDescription, editPrivate, updateRoom]);

  const handleDeleteRoom = useCallback(() => {
    Alert.alert(t("chat.deleteRoom"), t("chat.deleteRoomConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () =>
          deleteRoom(roomId ?? "", {
            onSuccess: () => router.replace("/(tabs)" as any),
          }),
      },
    ]);
  }, [deleteRoom, roomId, router, t]);

  const handleLeaveRoom = useCallback(() => {
    Alert.alert(t("chat.leaveRoom"), t("chat.leaveRoomConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("chat.leaveRoom"),
        style: "destructive",
        onPress: () =>
          leaveRoom(roomId ?? "", {
            onSuccess: () => router.replace("/(tabs)" as any),
          }),
      },
    ]);
  }, [leaveRoom, roomId, router, t]);

  const handleKick = useCallback(
    (userId: string, username: string) => {
      Alert.alert(t("chat.kick"), t("chat.kickConfirm", { username }), [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("chat.kick"),
          style: "destructive",
          onPress: () => kickMember({ roomId: roomId ?? "", userId }),
        },
      ]);
    },
    [kickMember, roomId, t],
  );

  const handleSetRole = useCallback(
    (userId: string, role: "admin" | "member") => {
      setMemberRole({ roomId: roomId ?? "", userId, role });
    },
    [setMemberRole, roomId],
  );

  const handleCreateInvite = useCallback(() => {
    const expires = inviteExpires.trim() ? Number(inviteExpires) : undefined;
    const maxUses = inviteMaxUses.trim() ? Number(inviteMaxUses) : undefined;
    createInvitation(
      { roomId: roomId ?? "", expiresInHours: expires, maxUses },
      {
        onSuccess: () => {
          setInviteModalVisible(false);
          setInviteExpires("");
          setInviteMaxUses("");
        },
      },
    );
  }, [createInvitation, roomId, inviteExpires, inviteMaxUses]);

  if (roomLoading || !room) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator size="large" color={colors.purple} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-cream" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center gap-2 border-b border-border-soft px-4 pb-2.5 pt-1">
        <Pressable onPress={() => router.back()} className="h-8 w-8 items-center justify-center rounded-xl active:bg-surface-alt">
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <Text className="flex-1 text-center font-display-bold text-[17px] text-ink" numberOfLines={1}>
          {t("chat.roomSettings")}
        </Text>
        <View className="h-8 w-8" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Room info */}
        <Section title={t("chat.roomInfo")}>
          {!editingInfo ? (
            <>
              <Row label={t("chat.roomName")} value={room.name} />
              <Row label={t("chat.roomDescription")} value={room.description ?? "-"} last />
              {canManage && (
                <Pressable
                  onPress={startEdit}
                  className="items-center border-t border-border-soft py-3 active:bg-surface-alt"
                >
                  <Text className="text-[13px] font-sans-semibold text-purple">
                    {t("common.edit")}
                  </Text>
                </Pressable>
              )}
            </>
          ) : (
            <View className="p-4">
              <Text className="mb-1.5 text-[12px] font-sans-semibold text-ink">{t("chat.roomName")}</Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                className="rounded-xl border border-border-soft bg-cream px-3 py-2 text-[14px] text-ink"
              />
              <Text className="mb-1.5 mt-3 text-[12px] font-sans-semibold text-ink">{t("chat.roomDescription")}</Text>
              <TextInput
                value={editDescription}
                onChangeText={setEditDescription}
                className="rounded-xl border border-border-soft bg-cream px-3 py-2 text-[14px] text-ink"
                multiline
              />
              <View className="mt-3 flex-row items-center justify-between">
                <Text className="text-[13px] text-ink">{t("chat.privateRoom")}</Text>
                <Switch value={editPrivate} onValueChange={setEditPrivate} />
              </View>
              <View className="mt-4 flex-row gap-2">
                <Pressable
                  onPress={() => setEditingInfo(false)}
                  className="flex-1 rounded-xl border border-border-soft py-2.5 active:bg-surface-alt"
                >
                  <Text className="text-center text-[13px] font-sans-semibold text-ink">{t("common.cancel")}</Text>
                </Pressable>
                <Pressable
                  onPress={saveRoomInfo}
                  disabled={updatingRoom || !editName.trim()}
                  className="flex-1 rounded-xl bg-purple py-2.5 active:opacity-80 disabled:opacity-50"
                >
                  {updatingRoom ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-center text-[13px] font-sans-semibold text-white">{t("common.save")}</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </Section>

        {/* Members */}
        <Section title={t("chat.members")}>
          {membersLoading ? (
            <View className="py-6">
              <ActivityIndicator size="small" color={colors.purple} />
            </View>
          ) : (members ?? []).length === 0 ? (
            <Text className="py-6 text-center text-[13px] text-ink-3">{t("chat.noMembers")}</Text>
          ) : (
            (members ?? []).map((member, index) => {
              const isMe = member.user_id === currentUserId;
              const canModify = isOwner && !isMe;
              return (
                <View
                  key={member.user_id}
                  className={`flex-row items-center gap-3 px-4 py-3 ${index < (members ?? []).length - 1 ? "border-b border-border-soft" : ""}`}
                >
                  <View
                    className="h-9 w-9 items-center justify-center overflow-hidden rounded-xl"
                    style={{ backgroundColor: colors.purpleLight }}
                  >
                    <Text className="text-[13px] font-sans-semibold" style={{ color: colors.purple }}>
                      {member.username?.slice(0, 2).toUpperCase() ?? "?"}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[13px] font-sans-semibold text-ink">
                      {member.username} {isMe ? `(${t("chat.you")})` : ""}
                    </Text>
                    <Text className="text-[10px] text-ink-4 capitalize">{member.role}</Text>
                  </View>
                  {canModify && (
                    <View className="flex-row gap-1">
                      {member.role === "member" ? (
                        <Pressable
                          onPress={() => handleSetRole(member.user_id, "admin")}
                          disabled={settingRole}
                          className="rounded-lg bg-purple-light px-2 py-1"
                        >
                          <Text className="text-[10px] font-sans-semibold text-purple">{t("chat.setAdmin")}</Text>
                        </Pressable>
                      ) : member.role === "admin" ? (
                        <Pressable
                          onPress={() => handleSetRole(member.user_id, "member")}
                          disabled={settingRole}
                          className="rounded-lg bg-surface-alt px-2 py-1"
                        >
                          <Text className="text-[10px] font-sans-semibold text-ink-3">{t("chat.setMember")}</Text>
                        </Pressable>
                      ) : null}
                      <Pressable
                        onPress={() => handleKick(member.user_id, member.username)}
                        disabled={kicking}
                        className="rounded-lg bg-rose-light px-2 py-1"
                      >
                        <Text className="text-[10px] font-sans-semibold text-rose">{t("chat.kick")}</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </Section>

        {/* Invitations */}
        {canManage && (
          <Section title={t("chat.invitations")}>
            <Pressable
              onPress={() => setInviteModalVisible(true)}
              className="flex-row items-center gap-3 px-4 py-3.5 active:bg-surface-alt"
            >
              <View className="h-8 w-8 items-center justify-center rounded-xl bg-purple-light">
                <Ionicons name="add" size={18} color={colors.purple} />
              </View>
              <Text className="flex-1 text-[14px] font-sans-medium text-ink">{t("chat.createInvitation")}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.ink4} />
            </Pressable>
            {invitationsLoading ? (
              <View className="py-4">
                <ActivityIndicator size="small" color={colors.purple} />
              </View>
            ) : (invitations ?? []).length === 0 ? (
              <Text className="py-4 text-center text-[12px] text-ink-3">{t("chat.noInvitations")}</Text>
            ) : (
              (invitations ?? []).map((invite, index) => (
                <View
                  key={invite.id}
                  className={`flex-row items-center gap-3 px-4 py-3 ${index < (invitations ?? []).length - 1 ? "border-t border-border-soft" : ""}`}
                >
                  <View className="flex-1">
                    <Text className="text-[13px] font-sans-semibold text-ink" selectable>
                      {invite.invite_code}
                    </Text>
                    <Text className="text-[10px] text-ink-4">
                      {invite.used_count} / {invite.max_uses ?? "∞"} {t("chat.used")} · {invite.is_active ? t("chat.active") : t("chat.inactive")}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => Clipboard.setString(invite.invite_code)}
                    className="mr-1 rounded-lg bg-purple-light px-2 py-1"
                  >
                    <Ionicons name="copy-outline" size={14} color={colors.purple} />
                  </Pressable>
                  <Pressable
                    onPress={() => deleteInvitation({ roomId: roomId ?? "", invitationId: invite.id })}
                    disabled={deletingInvite}
                    className="rounded-lg bg-rose-light px-2 py-1"
                  >
                    <Text className="text-[10px] font-sans-semibold text-rose">{t("common.delete")}</Text>
                  </Pressable>
                </View>
              ))
            )}
          </Section>
        )}

        {/* Danger zone */}
        <Section title={t("profile.account")}>
          <Row
            label={t("chat.leaveRoom")}
            icon="exit-outline"
            onPress={handleLeaveRoom}
            loading={leavingRoom}
          />
          {isOwner && (
            <Row
              label={t("chat.deleteRoom")}
              icon="trash-outline"
              destructive
              onPress={handleDeleteRoom}
              loading={deletingRoom}
              last
            />
          )}
        </Section>

        <View className="h-8" />
      </ScrollView>

      {/* Create invitation modal */}
      {inviteModalVisible && (
        <View className="absolute inset-0 items-center justify-center bg-black/40 px-6">
          <View className="w-full rounded-2xl bg-surface p-4">
            <Text className="mb-3 text-[16px] font-sans-semibold text-ink">{t("chat.createInvitation")}</Text>
            <Text className="mb-1.5 text-[12px] font-sans-semibold text-ink">{t("chat.expiresInHours")}</Text>
            <TextInput
              value={inviteExpires}
              onChangeText={setInviteExpires}
              keyboardType="numeric"
              placeholder={t("chat.unlimited")}
              placeholderTextColor={colors.ink4}
              className="rounded-xl border border-border-soft bg-cream px-3 py-2 text-[14px] text-ink"
            />
            <Text className="mb-1.5 mt-3 text-[12px] font-sans-semibold text-ink">{t("chat.maxUses")}</Text>
            <TextInput
              value={inviteMaxUses}
              onChangeText={setInviteMaxUses}
              keyboardType="numeric"
              placeholder={t("chat.unlimited")}
              placeholderTextColor={colors.ink4}
              className="rounded-xl border border-border-soft bg-cream px-3 py-2 text-[14px] text-ink"
            />
            <View className="mt-4 flex-row gap-2">
              <Pressable
                onPress={() => {
                  setInviteModalVisible(false);
                  setInviteExpires("");
                  setInviteMaxUses("");
                }}
                className="flex-1 rounded-xl border border-border-soft py-2.5 active:bg-surface-alt"
              >
                <Text className="text-center text-[13px] font-sans-semibold text-ink">{t("common.cancel")}</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateInvite}
                disabled={creatingInvite}
                className="flex-1 rounded-xl bg-purple py-2.5 active:opacity-80 disabled:opacity-50"
              >
                {creatingInvite ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-center text-[13px] font-sans-semibold text-white">{t("common.create")}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
