/**
 * Single chat message bubble.
 *
 * Renders text, file, or image messages with sender info, timestamps,
 * reply quotes, and reaction chips.
 */

import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/lib/hooks/useThemeColors";
import { formatMessageTime } from "@/lib/utils/date";
import type { Message } from "@/lib/api/messages";

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  showHeader: boolean;
}

/**
 * @param props - Component props.
 * @returns A chat bubble element.
 */
export function MessageBubble({ message, isMe, showHeader }: MessageBubbleProps) {
  const colors = useThemeColors();
  const senderInitial = message.sender.username?.slice(0, 2).toUpperCase() ?? "?";

  return (
    <View
      style={{
        alignSelf: isMe ? "flex-end" : "flex-start",
        maxWidth: "85%",
        marginBottom: 12,
      }}
    >
      {!isMe && showHeader && (
        <View className="mb-1 flex-row items-center gap-2 px-1">
          <View
            className="h-6 w-6 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.purpleLight }}
          >
            <Text
              className="text-[10px] font-sans-semibold"
              style={{ color: colors.purple }}
            >
              {senderInitial}
            </Text>
          </View>
          <Text className="text-xs font-sans-semibold text-ink-2">
            {message.sender.username}
          </Text>
          <Text className="text-[10px] text-ink-3">
            {formatMessageTime(message.created_at)}
          </Text>
        </View>
      )}

      {message.reply_to_message && (
        <View className="mb-1 rounded-lg border-l-4 border-purple bg-surface px-3 py-2">
          <Text className="text-xs font-sans-semibold text-purple">
            {message.reply_to_message.sender.username}
          </Text>
          <Text className="mt-0.5 text-xs text-ink-3" numberOfLines={2}>
            {message.reply_to_message.content}
          </Text>
        </View>
      )}

      <View
        className={`rounded-2xl px-4 py-2.5 ${isMe ? "rounded-br-md bg-purple" : "rounded-bl-md bg-surface"}`}
        style={{
          shadowOpacity: isMe ? 0.1 : 0.05,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 1 },
          elevation: 2,
        }}
      >
        {message.message_type === "file" ? (
          <View className="flex-row items-center gap-3">
            <View
              className="h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: colors.purpleLight }}
            >
              <Ionicons name="document-outline" size={18} color={colors.purple} />
            </View>
            <View className="flex-1">
              <Text
                className={`text-sm font-sans-medium ${isMe ? "text-white" : "text-ink"}`}
                numberOfLines={1}
              >
                {message.content}
              </Text>
              <Text
                style={{ color: isMe ? "rgba(255,255,255,0.7)" : colors.ink3 }}
                className="text-xs"
              >
                File
              </Text>
            </View>
          </View>
        ) : message.message_type === "image" ? (
          <View
            className="items-center justify-center rounded-xl px-6 py-8"
            style={{
              backgroundColor: isMe ? "rgba(255,255,255,0.15)" : colors.purpleLight,
            }}
          >
            <Ionicons
              name="image-outline"
              size={28}
              color={isMe ? colors.cream : colors.purple}
            />
            <Text
              style={{ color: isMe ? "rgba(255,255,255,0.7)" : colors.ink3 }}
              className="mt-1 text-xs"
            >
              Image
            </Text>
          </View>
        ) : (
          <Text className={`text-[15px] leading-5 ${isMe ? "text-white" : "text-ink"}`}>
            {message.content}
          </Text>
        )}

        {isMe && (
          <Text
            style={{ color: "rgba(255,255,255,0.7)" }}
            className="mt-1 text-right text-[10px]"
          >
            {formatMessageTime(message.created_at)}
          </Text>
        )}
      </View>

      {!!message.reactions?.length && (
        <View
          className={`mt-1 flex-row flex-wrap gap-1 ${isMe ? "justify-end" : "justify-start"}`}
        >
          {message.reactions.map((reaction, idx) => (
            <View
              key={`${reaction.emoji}-${idx}`}
              className="flex-row items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5"
            >
              <Text className="text-xs">{reaction.emoji}</Text>
              <Text className="text-[10px] font-sans-medium text-ink-2">
                {reaction.count}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
