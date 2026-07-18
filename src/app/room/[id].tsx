import { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "@/lib/hooks/useThemeColors";
import { useRoom } from "@/lib/hooks/useRoomsQuery";
import { useMessages, usePinnedMessages } from "@/lib/hooks/useMessagesQuery";
import { useWsJoinRoom } from "@/lib/ws/hooks";
import { getWsClient } from "@/lib/ws/client";
import { useAuthStore } from "@/lib/store/auth";
import { formatMessageTime } from "@/lib/utils/date";
import type { Message } from "@/lib/api/messages";

function ChatHeader({
  roomName,
  memberCount,
  onBack,
}: {
  roomName: string;
  memberCount?: number;
  onBack: () => void;
}) {
  const colors = useThemeColors();
  return (
    <View
      className="flex-row items-center gap-2.5 border-b border-border-soft px-4 pb-2.5 pt-1"
      style={{ backgroundColor: "rgba(250,247,242,0.92)" }}
    >
      <Pressable onPress={onBack} className="h-8 w-8 items-center justify-center rounded-xl active:bg-surface-alt">
        <Ionicons name="chevron-back" size={22} color={colors.ink} />
      </Pressable>
      <View
        className="h-9 w-9 items-center justify-center overflow-hidden rounded-xl"
        style={{ backgroundColor: colors.purpleLight }}
      >
        <Text className="text-[13px] font-sans-semibold" style={{ color: colors.purple }}>
          {roomName.slice(0, 2).toUpperCase()}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="font-display-bold text-[15px] text-ink">{roomName}</Text>
        <View className="flex-row items-center gap-1">
          <View className="h-[6px] w-[6px] rounded-full bg-mint" />
          <Text className="text-[11px] text-ink-3">{memberCount ?? 0} members</Text>
        </View>
      </View>
      <View className="flex-row gap-1">
        <Pressable className="h-[34px] w-[34px] items-center justify-center rounded-xl active:bg-surface-alt">
          <Ionicons name="call-outline" size={18} color={colors.ink2} />
        </Pressable>
        <Pressable className="h-[34px] w-[34px] items-center justify-center rounded-xl active:bg-surface-alt">
          <Ionicons name="ellipsis-vertical" size={18} color={colors.ink2} />
        </Pressable>
      </View>
    </View>
  );
}

function DateDivider({ date }: { date: string }) {
  return (
    <View className="items-center justify-center py-3">
      <Text className="rounded-lg bg-surface-alt px-3 py-1 text-[11px] font-sans-semibold text-ink-4">
        {date}
      </Text>
    </View>
  );
}

function MessageBubble({
  message,
  isOwn,
  showHeader,
}: {
  message: Message;
  isOwn: boolean;
  showHeader: boolean;
}) {
  const colors = useThemeColors();
  const time = formatMessageTime(message.created_at);

  const isImage = message.message_type === "image";
  const isFile = message.message_type === "file";

  return (
    <View className={`mb-2 ${isOwn ? "items-end" : "items-start"}`}>
      {showHeader && !isOwn && (
        <View className="mb-1 flex-row items-center gap-2">
          <View
            className="h-7 w-7 items-center justify-center overflow-hidden rounded-full"
            style={{ backgroundColor: colors.purpleLight }}
          >
            <Text className="text-[11px] font-sans-semibold" style={{ color: colors.purple }}>
              {message.sender?.username?.slice(0, 1) ?? "?"}
            </Text>
          </View>
          <Text className="text-[12px] font-sans-semibold text-ink">
            {message.sender?.username ?? "Unknown"}
          </Text>
          <Text className="text-[10px] text-ink-4">{time}</Text>
        </View>
      )}

      {/* Reply reference */}
      {message.reply_to_message && !isFile && (
        <View
          className="mb-1 rounded-xl border-l-[2.5px] p-2"
          style={{
            borderLeftColor: colors.purple,
            backgroundColor: "rgba(123,106,232,0.08)",
          }}
        >
          <Text className="text-[10px] font-sans-semibold" style={{ color: colors.purple }}>
            {message.reply_to_message.sender.username}
          </Text>
          <Text className="mt-0.5 text-[11px] text-ink-3" numberOfLines={1}>
            {message.reply_to_message.content}
          </Text>
        </View>
      )}

      {/* File message */}
      {isFile ? (
        <FileMessage message={message} />
      ) : isImage ? (
        <View className="mt-1 max-w-[70%] self-start overflow-hidden rounded-2xl border border-border-soft">
          <View
            className="h-40 w-full items-center justify-center"
            style={{
              backgroundImage: "linear-gradient(135deg, var(--purple-light), var(--peach-light), var(--mint-light))",
            }}
          >
            <Ionicons name="image-outline" size={32} color={colors.purple} />
          </View>
        </View>
      ) : (
        <View
          className={`max-w-[80%] rounded-[18px] px-3.5 py-2.5 ${
            isOwn
              ? "rounded-br-md bg-purple"
              : "rounded-bl-md border border-border-soft bg-surface"
          }`}
        >
          <Text
            className={`text-[13.5px] leading-[1.45] ${isOwn ? "text-white" : "text-ink"}`}
          >
            {message.content}
          </Text>
        </View>
      )}

      {/* Reactions */}
      {message.reactions && message.reactions.length > 0 && (
        <View className="mt-1 flex-row flex-wrap gap-1">
          {message.reactions.map((r: any, i: number) => (
            <Pressable
              key={i}
              className="flex-row items-center gap-1 rounded-xl border px-2 py-0.5"
              style={{
                backgroundColor: colors.purpleLight,
                borderColor: "rgba(123,106,232,0.2)",
              }}
            >
              <Text style={{ fontSize: 11 }}>{r.emoji}</Text>
              <Text className="text-[10px] font-sans-semibold" style={{ color: colors.purple }}>
                {r.count}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function TypingIndicator({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  const label = names.length === 1
    ? `${names[0]} is typing…`
    : names.length === 2
    ? `${names[0]} and ${names[1]} are typing…`
    : `${names[0]} and ${names.length - 1} others are typing…`;

  return (
    <View className="flex-row items-center gap-1.5 px-4 py-1">
      <View className="flex-row gap-0.5">
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            className="h-1.5 w-1.5 rounded-full opacity-40"
            style={{
              backgroundColor: "#94A3B8",
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </View>
      <Text className="text-[11px] text-ink-4">{label}</Text>
    </View>
  );
}

function FileMessage({ message }: { message: Message }) {
  const colors = useThemeColors();
  return (
    <View className="mt-1 max-w-[80%] self-start rounded-xl bg-surface-alt p-2.5">
      <View className="flex-row items-center gap-2.5">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-purple-light">
          <Ionicons name="document-outline" size={18} color={colors.purple} />
        </View>
        <View className="flex-1">
          <Text className="text-[12px] font-sans-semibold text-ink" numberOfLines={1}>
            {message.content}
          </Text>
          <Text className="text-[10px] text-ink-4">{message.message_type === "file" ? "File" : ""}</Text>
        </View>
      </View>
    </View>
  );
}

function ChatInput({
  onSend,
}: {
  onSend: (text: string) => void;
}) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <View
      className="flex-row items-end gap-2 border-t border-border-soft px-3 pt-2"
      style={{ backgroundColor: "rgba(250,247,242,0.95)", paddingBottom: 4 + insets.bottom }}
    >
      <View className="flex-row gap-0.5 pb-1">
        <Pressable className="h-8 w-8 items-center justify-center rounded-xl active:bg-surface-alt">
          <Ionicons name="add-circle-outline" size={22} color={colors.ink3} />
        </Pressable>
      </View>
      <View
        className="flex-1 flex-row items-center rounded-[22px] border px-3.5 py-2"
        style={{ borderColor: colors.border, backgroundColor: colors.surface }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={t("chat.messagePlaceholder")}
          placeholderTextColor={colors.ink4}
          className="flex-1 text-[14px] text-ink"
          multiline
          maxLength={2000}
        />
      </View>
      <Pressable
        onPress={handleSend}
        className="mb-0.5 h-[38px] w-[38px] items-center justify-center rounded-full"
        style={{ backgroundColor: colors.purple }}
      >
        <Ionicons name="send" size={18} color="white" />
      </Pressable>
    </View>
  );
}

export default function ChatRoomScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { id: roomId } = useLocalSearchParams<{ id: string }>();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const { data: room, isLoading: roomLoading } = useRoom(roomId ?? "");
  const {
    data: messagesPages,
    isLoading: messagesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(roomId ?? "");
  const { data: pinnedMessages } = usePinnedMessages(roomId ?? "");

  useWsJoinRoom(roomId ?? "");

  const flatListRef = useRef<FlatList>(null);
  const allMessages = messagesPages?.pages.flatMap((p) => p.messages) ?? [];

  useEffect(() => {
    if (allMessages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [allMessages.length]);

  useEffect(() => {
    if (!roomId) return;
    const ws = getWsClient();
    const unsubTyping = ws.on("UserTyping", (payload: any) => {
      if (payload.room_id === roomId && payload.user_id !== currentUserId) {
        setTypingUsers((prev) => prev.includes(payload.username) ? prev : [...prev, payload.username]);
      }
    });
    const unsubStopTyping = ws.on("UserStopTyping", (payload: any) => {
      if (payload.room_id === roomId) {
        setTypingUsers((prev) => prev.filter((n) => n !== payload.username));
      }
    });
    return () => {
      unsubTyping();
      unsubStopTyping();
    };
  }, [roomId, currentUserId]);

  const handleSend = useCallback(
    (text: string) => {
      if (!roomId) return;
      getWsClient().send("ChatMessage", {
        room_id: roomId,
        content: text,
      });
    },
    [roomId],
  );

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  if (roomLoading || !room) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator size="large" color={colors.purple} />
      </View>
    );
  }

  const pinnedMessage = pinnedMessages?.[0];

  return (
    <View className="flex-1 bg-cream" style={{ paddingTop: insets.top }}>
      <ChatHeader
        roomName={room.name ?? "Chat"}
        memberCount={room.member_count}
        onBack={() => router.back()}
      />

      {/* Pinned banner */}
      {pinnedMessage && (
        <Pressable className="mx-4 mb-2 mt-2 flex-row items-center gap-2 rounded-xl border border-peach-border-soft bg-peach-light px-3 py-2">
          <Ionicons name="pin" size={14} color={colors.amberText} />
          <Text className="flex-1 text-[11px] text-amber-text" numberOfLines={1}>
            <Text className="font-sans-semibold">{pinnedMessage.sender_name}</Text>
            : {pinnedMessage.content}
          </Text>
        </Pressable>
      )}

      {/* Messages */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={allMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            const isOwn = item.sender?.id === currentUserId;
            const prevMsg = index > 0 ? allMessages[index - 1] : null;
            const showHeader = !prevMsg || prevMsg.sender?.id !== item.sender?.id;
            const isNewDay = !prevMsg || new Date(item.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();

            return (
              <View className="px-4">
                {isNewDay && (
                  <DateDivider date={new Date(item.created_at).toLocaleDateString()} />
                )}
                <MessageBubble message={item} isOwn={isOwn} showHeader={showHeader} />
              </View>
            );
          }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            <>
              {isFetchingNextPage && (
                <View className="py-4">
                  <ActivityIndicator size="small" color={colors.purple} />
                </View>
              )}
              <TypingIndicator names={typingUsers} />
            </>
          }
          ListEmptyComponent={
            messagesLoading ? (
              <View className="flex-1 items-center justify-center py-16">
                <ActivityIndicator size="large" color={colors.purple} />
              </View>
            ) : (
              <View className="flex-1 items-center justify-center py-16">
                <Text className="text-sm text-ink-3">{t("home.noConversations")}</Text>
              </View>
            )
          }
          className="flex-1"
          showsVerticalScrollIndicator={false}
        />

        <ChatInput onSend={handleSend} />
      </KeyboardAvoidingView>
    </View>
  );
}
