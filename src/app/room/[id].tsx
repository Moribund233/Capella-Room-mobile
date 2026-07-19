import { useState, useCallback, useEffect, useRef, useMemo } from "react";
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
  Alert,
  Clipboard,
  Modal,
  Linking,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "@/lib/hooks/useThemeColors";
import { useRoom, useRoomMembers } from "@/lib/hooks/useRoomsQuery";
import { useMessageDraft } from "@/lib/hooks/useMessageDraft";
import { useAudioRecorder } from "@/lib/hooks/useAudioRecorder";
import {
  useMessages,
  usePinnedMessages,
  useSearchMessages,
  useAddReaction,
  useRemoveReaction,
  useEditMessage,
  useDeleteMessage,
  usePinMessage,
  useUnpinMessage,
} from "@/lib/hooks/useMessagesQuery";
import { useWsJoinRoom } from "@/lib/ws/hooks";
import { getWsClient } from "@/lib/ws/client";
import type { NewMessagePayload } from "@/lib/ws/types";
import { useAuthStore } from "@/lib/store/auth";
import { formatMessageTime } from "@/lib/utils/date";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Image } from "expo-image";
import { uploadImage, uploadFile } from "@/lib/api/files";
import { downloadAndOpenFile } from "@/lib/utils/files";
import { EmojiPicker } from "@/components/chat/EmojiPicker";
import { MessageActionsSheet, type MessageAction } from "@/components/chat/MessageActionsSheet";
import { ImageViewer } from "@/components/chat/ImageViewer";
import { ForwardModal } from "@/components/chat/ForwardModal";
import { EditHistoryModal } from "@/components/chat/EditHistoryModal";
import { AudioMessage } from "@/components/chat/AudioMessage";
import type { Message } from "@/lib/api/messages";

/** Payload emitted by the chat input when the user sends a message. */
interface SendPayload {
  content: string;
  message_type?: "text" | "image" | "file" | "audio";
  reply_to?: string | null;
  file_url?: string | null;
}

/** Local optimistic message used to show sending / failed status. */
interface PendingMessage {
  id: string;
  content: string;
  message_type: "text" | "image" | "file" | "audio";
  reply_to: string | null;
  file_url: string | null;
  status: "pending" | "failed";
  createdAt: number;
}

function ChatHeader({
  roomName,
  memberCount,
  onBack,
  onSearch,
  onManage,
}: {
  roomName: string;
  memberCount?: number;
  onBack: () => void;
  onSearch?: () => void;
  onManage?: () => void;
}) {
  const { t } = useTranslation();
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
          <Text className="text-[11px] text-ink-3">
            {memberCount ?? 0} {t("common.members")}
          </Text>
        </View>
      </View>
      <View className="flex-row gap-1">
        {onSearch && (
          <Pressable onPress={onSearch} className="h-[34px] w-[34px] items-center justify-center rounded-xl active:bg-surface-alt">
            <Ionicons name="search-outline" size={18} color={colors.ink2} />
          </Pressable>
        )}
        <Pressable className="h-[34px] w-[34px] items-center justify-center rounded-xl active:bg-surface-alt">
          <Ionicons name="call-outline" size={18} color={colors.ink2} />
        </Pressable>
        <Pressable onPress={onManage} className="h-[34px] w-[34px] items-center justify-center rounded-xl active:bg-surface-alt">
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

const URL_REGEX = /https?:\/\/[^\s]+/gi;

function LinkifiedText({
  text,
  className,
  style,
}: {
  text: string;
  className?: string;
  style?: import("react-native").TextStyle;
}) {
  const { t } = useTranslation();
  const parts: React.ReactNode[] = [];
  const matches = text.match(URL_REGEX);
  let lastIndex = 0;

  if (matches) {
    matches.forEach((url) => {
      const index = text.indexOf(url, lastIndex);
      if (index > lastIndex) {
        parts.push(
          <Text key={`text-${index}`} className={className} style={style}>
            {text.slice(lastIndex, index)}
          </Text>,
        );
      }
      parts.push(
        <Text
          key={`link-${index}`}
          className={className}
          style={[style, { textDecorationLine: "underline" }]}
          onPress={() => Linking.openURL(url).catch(() => Alert.alert(t("errors.generic"), t("chat.openLinkFailed")))}
        >
          {url}
        </Text>,
      );
      lastIndex = index + url.length;
    });
  }

  if (lastIndex < text.length) {
    parts.push(
      <Text key="text-end" className={className} style={style}>
        {text.slice(lastIndex)}
      </Text>,
    );
  }
  return <Text className={className} style={style}>{parts}</Text>;
}

function MessageBubble({
  message,
  isOwn,
  showHeader,
  currentUserId,
  readBy,
  sendingStatus,
  onLongPress,
  onReactionPress,
  onImagePress,
  onRetry,
}: {
  message: Message;
  isOwn: boolean;
  showHeader: boolean;
  currentUserId?: string;
  readBy?: Set<string>;
  sendingStatus?: "pending" | "failed";
  onLongPress?: () => void;
  onReactionPress?: (emoji: string) => void;
  onImagePress?: (uri: string) => void;
  onRetry?: () => void;
}) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const time = message.created_at ? formatMessageTime(message.created_at) : "-";

  const isImage = message.message_type === "image";
  const isFile = message.message_type === "file";
  const isAudio = message.message_type === "audio";
  const isDeleted = message.is_deleted;

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
            {message.sender?.username ?? t("common.unknown")}
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

      <Pressable onLongPress={onLongPress}>
        {/* File message */}
        {isFile ? (
          <FileMessage message={message} />
        ) : isAudio ? (
          <AudioMessage fileUrl={message.file_url ?? ""} />
        ) : isImage ? (
          <Pressable
            onPress={() => message.file_url && onImagePress?.(message.file_url)}
            className="mt-1 max-w-[70%] self-start overflow-hidden rounded-2xl border border-border-soft"
          >
            {message.file_url ? (
              <Image
                source={{ uri: message.file_url }}
                className="h-40 w-60"
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View
                className="h-40 w-60 items-center justify-center"
                style={{ backgroundColor: colors.surfaceAlt }}
              >
                <Ionicons name="image-outline" size={32} color={colors.purple} />
              </View>
            )}
          </Pressable>
        ) : (
          <View
            className={`max-w-[80%] rounded-[18px] px-3.5 py-2.5 ${
              isOwn
                ? "rounded-br-md bg-purple"
                : "rounded-bl-md border border-border-soft bg-surface"
            }`}
          >
            {isDeleted ? (
              <Text className={`text-[13.5px] italic text-ink-4`}>
                {t("chat.deleted")}
              </Text>
            ) : (
              <LinkifiedText
                text={message.content}
                className={`text-[13.5px] leading-[1.45] ${isOwn ? "text-white" : "text-ink"}`}
              />
            )}
            {!isDeleted && message.is_edited && (
              <Text className={`mt-1 text-[9px] text-right ${isOwn ? "text-white/70" : "text-ink-4"}`}>
                {t("chat.edited")}
              </Text>
            )}
          </View>
        )}
      </Pressable>

      {/* Read receipt */}
      {isOwn && readBy && readBy.size > 0 && !sendingStatus && (
        <View className={`mt-0.5 flex-row items-center gap-1 ${isOwn ? "self-end" : "self-start"}`}>
          <Ionicons name="checkmark-done" size={10} color={colors.ink4} />
          <Text className="text-[9px] text-ink-4">
            {readBy.size === 1 ? t("chat.read") : `${t("chat.read")} ${readBy.size}`}
          </Text>
        </View>
      )}

      {/* Sending status */}
      {isOwn && sendingStatus && (
        <Pressable
          onPress={sendingStatus === "failed" ? onRetry : undefined}
          className={`mt-0.5 flex-row items-center gap-1 ${isOwn ? "self-end" : "self-start"}`}
        >
          {sendingStatus === "pending" ? (
            <>
              <ActivityIndicator size={10} color={colors.ink4} />
              <Text className="text-[9px] text-ink-4">{t("chat.sending")}</Text>
            </>
          ) : (
            <>
              <Ionicons name="alert-circle" size={10} color={colors.rose} />
              <Text className="text-[9px] text-rose">{t("chat.failed")}</Text>
            </>
          )}
        </Pressable>
      )}

      {/* Reactions */}
      {message.reactions && message.reactions.length > 0 && (
        <View className="mt-1 flex-row flex-wrap gap-1">
          {message.reactions.map((r) => {
            const hasMine = currentUserId && r.users?.includes(currentUserId);
            return (
              <Pressable
                key={r.emoji}
                onPress={() => onReactionPress?.(r.emoji)}
                className="flex-row items-center gap-1 rounded-xl border px-2 py-0.5"
                style={{
                  backgroundColor: hasMine ? colors.purpleLight : colors.surfaceAlt,
                  borderColor: hasMine ? "rgba(123,106,232,0.4)" : "rgba(0,0,0,0.06)",
                }}
              >
                <Text style={{ fontSize: 11 }}>{r.emoji}</Text>
                <Text
                  className="text-[10px] font-sans-semibold"
                  style={{ color: hasMine ? colors.purple : colors.ink3 }}
                >
                  {r.count}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

function TypingIndicator({ names }: { names: string[] }) {
  const { t } = useTranslation();
  if (names.length === 0) return null;
  const label =
    names.length === 1
      ? t("chat.typingSingle", { name: names[0] })
      : names.length === 2
        ? t("chat.typingTwo", { name0: names[0], name1: names[1] })
        : t("chat.typingMany", { name: names[0], count: names.length - 1 });

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
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [opening, setOpening] = useState(false);
  const fileUrl = message.file_url;

  const handleOpen = async () => {
    const url = fileUrl ?? message.content;
    if (!url || opening) return;
    setOpening(true);
    try {
      await downloadAndOpenFile(url, message.content);
    } catch {
      Alert.alert(t("errors.generic"), t("chat.openFileFailed"));
    } finally {
      setOpening(false);
    }
  };

  return (
    <Pressable onPress={handleOpen} className="mt-1 max-w-[80%] self-start rounded-xl bg-surface-alt p-2.5 active:opacity-80">
      <View className="flex-row items-center gap-2.5">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-purple-light">
          {opening ? (
            <ActivityIndicator size="small" color={colors.purple} />
          ) : (
            <Ionicons name="document-outline" size={18} color={colors.purple} />
          )}
        </View>
        <View className="flex-1">
          <Text className="text-[12px] font-sans-semibold text-ink" numberOfLines={1}>
            {message.content}
          </Text>
          <Text className="text-[10px] text-ink-4">{t("chat.file")}</Text>
        </View>
        {!opening && <Ionicons name="open-outline" size={16} color={colors.ink3} />}
      </View>
    </Pressable>
  );
}

function ChatInput({
  onSend,
  replyTo,
  onCancelReply,
  roomId,
}: {
  onSend: (payload: SendPayload) => void;
  replyTo?: Message | null;
  onCancelReply?: () => void;
  roomId: string;
}) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [text, setText] = useMessageDraft(roomId);
  const [uploading, setUploading] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const { isRecording, durationMillis, startRecording, stopRecording } = useAudioRecorder();
  const { data: members } = useRoomMembers(roomId);

  const mentionMatch = useMemo(() => {
    const lastWord = text.split(/\s+/).pop() ?? "";
    if (!lastWord.startsWith("@")) return null;
    return lastWord.slice(1).toLowerCase();
  }, [text]);

  const mentionCandidates = useMemo(() => {
    if (mentionMatch === null) return [];
    return (members ?? [])
      .filter((m) => m.username.toLowerCase().includes(mentionMatch))
      .slice(0, 5);
  }, [members, mentionMatch]);

  const insertMention = (username: string) => {
    const words = text.split(/\s+/);
    words[words.length - 1] = `@${username}`;
    setText(words.join(" ") + " ");
  };

  const sendTyping = useCallback(() => {
    if (!isTypingRef.current) {
      getWsClient().send("Typing", { room_id: roomId });
      isTypingRef.current = true;
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      getWsClient().send("StopTyping", { room_id: roomId });
      isTypingRef.current = false;
    }, 2000);
  }, [roomId]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || uploading) return;
    onSend({ content: trimmed, message_type: "text", reply_to: replyTo?.id ?? null });
    setText("");
    onCancelReply?.();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current) {
      getWsClient().send("StopTyping", { room_id: roomId });
      isTypingRef.current = false;
    }
  };

  const uploadMedia = async (
    localUri: string,
    filename: string,
    mimeType: string,
    messageType: "image" | "file" | "audio",
  ) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", { uri: localUri, name: filename, type: mimeType } as any);
      const fileInfo =
        messageType === "image" ? await uploadImage(formData) : await uploadFile(formData);
      onSend({ content: filename, message_type: messageType, file_url: fileInfo.file_url });
    } catch (err: any) {
      Alert.alert(t("chat.uploadFailed"), err?.message ?? t("chat.uploadFailedMessage"));
    } finally {
      setUploading(false);
    }
  };

  const handleStopRecording = async () => {
    const result = await stopRecording();
    if (!result) return;
    if (result.durationMillis < 500) {
      Alert.alert(t("chat.voiceTooShort"));
      return;
    }
    const durationSeconds = Math.ceil(result.durationMillis / 1000);
    await uploadMedia(
      result.uri,
      `voice_${durationSeconds}s.m4a`,
      "audio/m4a",
      "audio",
    );
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    await uploadMedia(asset.uri, asset.fileName ?? "photo.jpg", asset.mimeType ?? "image/jpeg", "image");
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    await uploadMedia(asset.uri, asset.fileName ?? "camera.jpg", asset.mimeType ?? "image/jpeg", "image");
  };

  const handlePickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
    if (result.canceled || !result.assets || !result.assets[0]) return;
    const asset = result.assets[0];
    await uploadMedia(asset.uri, asset.name, asset.mimeType ?? "application/octet-stream", "file");
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current) {
        getWsClient().send("StopTyping", { room_id: roomId });
      }
    };
  }, [roomId]);

  return (
    <View
      className="border-t border-border-soft px-3 pt-2"
      style={{ backgroundColor: "rgba(250,247,242,0.95)", paddingBottom: 4 + insets.bottom }}
    >
      {replyTo && (
        <View className="mb-2 flex-row items-center gap-2 rounded-xl border-l-[3px] border-purple bg-purple-light/30 px-3 py-2">
          <View className="flex-1">
            <Text className="text-[10px] font-sans-semibold text-purple">
              {t("chat.replyingTo", { name: replyTo.sender?.username ?? t("chat.you") })}
            </Text>
            <Text className="mt-0.5 text-[11px] text-ink-3" numberOfLines={1}>
              {replyTo.content}
            </Text>
          </View>
          <Pressable onPress={onCancelReply} className="h-6 w-6 items-center justify-center rounded-full active:bg-surface-alt">
            <Ionicons name="close" size={16} color={colors.ink3} />
          </Pressable>
        </View>
      )}
      {mentionCandidates.length > 0 && (
        <View className="mb-2 rounded-xl border border-border-soft bg-surface p-2">
          {mentionCandidates.map((member) => (
            <Pressable
              key={member.user_id}
              onPress={() => insertMention(member.username)}
              className="flex-row items-center gap-2 rounded-lg px-2 py-2 active:bg-surface-alt"
            >
              <View
                className="h-7 w-7 items-center justify-center rounded-full"
                style={{ backgroundColor: colors.purpleLight }}
              >
                <Text className="text-[10px] font-sans-semibold" style={{ color: colors.purple }}>
                  {member.username.slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <Text className="text-[13px] text-ink">{member.username}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {isRecording && (
        <View className="mb-2 flex-row items-center justify-center gap-2 rounded-2xl bg-rose-light px-4 py-2">
          <View className="h-2 w-2 rounded-full bg-rose" />
          <Text className="text-[13px] font-sans-semibold text-rose">{t("chat.recording")}</Text>
          <Text className="text-[12px] text-ink-3">{Math.ceil(durationMillis / 1000)}s</Text>
        </View>
      )}
      <View className="flex-row items-end gap-2">
        <View className="flex-row gap-0.5 pb-1">
          <Pressable
            onPress={handlePickImage}
            disabled={uploading}
            className="h-8 w-8 items-center justify-center rounded-xl active:bg-surface-alt"
          >
            <Ionicons name="image-outline" size={22} color={colors.ink3} />
          </Pressable>
          <Pressable
            onPress={handleTakePhoto}
            disabled={uploading}
            className="h-8 w-8 items-center justify-center rounded-xl active:bg-surface-alt"
          >
            <Ionicons name="camera-outline" size={22} color={colors.ink3} />
          </Pressable>
          <Pressable
            onPress={handlePickDocument}
            disabled={uploading}
            className="h-8 w-8 items-center justify-center rounded-xl active:bg-surface-alt"
          >
            <Ionicons name="document-attach-outline" size={22} color={colors.ink3} />
          </Pressable>
          {uploading && (
            <View className="h-8 w-8 items-center justify-center">
              <ActivityIndicator size="small" color={colors.purple} />
            </View>
          )}
        </View>
        <View
          className="flex-1 flex-row items-center rounded-[22px] border px-3.5 py-2"
          style={{ borderColor: colors.border, backgroundColor: colors.surface }}
        >
          <TextInput
            value={text}
            onChangeText={(val) => {
              setText(val);
              if (val.trim()) sendTyping();
            }}
            placeholder={t("chat.messagePlaceholder")}
            placeholderTextColor={colors.ink4}
            className="flex-1 text-[14px] text-ink"
            multiline
            maxLength={2000}
          />
        </View>
        <Pressable
          onPress={text.trim() ? handleSend : undefined}
          onPressIn={!text.trim() ? startRecording : undefined}
          onPressOut={!text.trim() ? handleStopRecording : undefined}
          disabled={uploading}
          className="mb-0.5 h-[38px] w-[38px] items-center justify-center rounded-full"
          style={{ backgroundColor: text.trim() && !uploading ? colors.purple : colors.surfaceAlt }}
        >
          <Ionicons
            name={text.trim() ? "send" : "mic"}
            size={18}
            color={text.trim() && !uploading ? "white" : colors.ink3}
          />
        </Pressable>
      </View>
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
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSender, setSearchSender] = useState<string | null>(null);
  const [searchDateDays, setSearchDateDays] = useState<number | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [activeMessage, setActiveMessage] = useState<Message | null>(null);
  const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [editMessage, setEditMessage] = useState<Message | null>(null);
  const [editText, setEditText] = useState("");
  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const [readByMap, setReadByMap] = useState<Record<string, Set<string>>>({});
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);
  const [editHistoryMessageId, setEditHistoryMessageId] = useState<string | null>(null);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const [searchNow, setSearchNow] = useState(() => Date.now());

  const { mutate: searchMessages, data: searchResults, isPending: searching } = useSearchMessages();
  const { mutate: addReaction } = useAddReaction(roomId ?? "");
  const { mutate: removeReaction } = useRemoveReaction(roomId ?? "");
  const { mutate: editMessageMutate } = useEditMessage(roomId ?? "");
  const { mutate: deleteMessageMutate } = useDeleteMessage(roomId ?? "");
  const { mutate: pinMessageMutate } = usePinMessage(roomId ?? "");
  const { mutate: unpinMessageMutate } = useUnpinMessage(roomId ?? "");

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

  const filteredSearchResults = useMemo(() => {
    if (!searchResults) return null;
    let results = searchResults as Message[];
    if (searchSender) {
      results = results.filter((msg) => msg.sender?.id === searchSender);
    }
    if (searchDateDays != null) {
      const cutoff = searchNow - searchDateDays * 24 * 60 * 60 * 1000;
      results = results.filter((msg) => new Date(msg.created_at).getTime() >= cutoff);
    }
    return results;
  }, [searchResults, searchSender, searchDateDays, searchNow]);

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
        setTypingUsers((prev) => (prev.includes(payload.username) ? prev : [...prev, payload.username]));
      }
    });
    const unsubStopTyping = ws.on("UserStopTyping", (payload: any) => {
      if (payload.room_id === roomId) {
        setTypingUsers((prev) => prev.filter((n) => n !== payload.username));
      }
    });
    const unsubRead = ws.on("MessageReadReceipt", (payload: any) => {
      if (payload.room_id === roomId && payload.user_id !== currentUserId) {
        setReadByMap((prev) => {
          const next = { ...prev };
          const set = next[payload.message_id] ? new Set(next[payload.message_id]) : new Set<string>();
          set.add(payload.user_id);
          next[payload.message_id] = set;
          return next;
        });
      }
    });
    const unsubNewMessage = ws.on("NewMessage", (payload: NewMessagePayload) => {
      if (payload.room_id !== roomId || payload.sender_id !== currentUserId) return;
      setPendingMessages((prev) => {
        const matchIndex = prev.findIndex(
          (p) =>
            p.status === "pending" &&
            p.content === payload.content &&
            p.message_type === (payload.message_type ?? "text") &&
            p.reply_to === (payload.reply_to ?? null) &&
            p.file_url === (payload.file_url ?? null),
        );
        if (matchIndex === -1) return prev;
        const next = [...prev];
        next.splice(matchIndex, 1);
        return next;
      });
    });
    return () => {
      unsubTyping();
      unsubStopTyping();
      unsubRead();
      unsubNewMessage();
    };
  }, [roomId, currentUserId]);

  const handleSend = useCallback(
    (payload: SendPayload) => {
      if (!roomId) return;
      const pendingId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const pending: PendingMessage = {
        id: pendingId,
        content: payload.content,
        message_type: payload.message_type ?? "text",
        reply_to: payload.reply_to ?? null,
        file_url: payload.file_url ?? null,
        status: "pending",
        createdAt: Date.now(),
      };
      setPendingMessages((prev) => [...prev, pending]);
      getWsClient().send("ChatMessage", {
        room_id: roomId,
        content: payload.content,
        message_type: payload.message_type ?? "text",
        reply_to: payload.reply_to ?? null,
        file_url: payload.file_url ?? null,
      });
      // Mark as failed if the server does not acknowledge within 8 seconds.
      setTimeout(() => {
        setPendingMessages((prev) =>
          prev.map((p) => (p.id === pendingId && p.status === "pending" ? { ...p, status: "failed" as const } : p)),
        );
      }, 8000);
    },
    [roomId],
  );

  const handleRetryPending = useCallback(
    (pending: PendingMessage) => {
      setPendingMessages((prev) => prev.filter((p) => p.id !== pending.id));
      handleSend({
        content: pending.content,
        message_type: pending.message_type,
        reply_to: pending.reply_to,
        file_url: pending.file_url,
      });
    },
    [handleSend],
  );

  const handleReactionPress = useCallback(
    (message: Message, emoji: string) => {
      if (!currentUserId) return;
      const reaction = message.reactions?.find((r) => r.emoji === emoji);
      const hasMine = reaction?.users?.includes(currentUserId);
      if (hasMine) {
        removeReaction({ messageId: message.id, emoji });
      } else {
        addReaction({ messageId: message.id, emoji });
      }
    },
    [currentUserId, addReaction, removeReaction],
  );

  const handleLongPress = useCallback((message: Message) => {
    setActiveMessage(message);
    setActionSheetVisible(true);
  }, []);

  const availableActions = useMemo<MessageAction[]>(() => {
    if (!activeMessage) return [];
    const isOwn = activeMessage.sender?.id === currentUserId;
    const isDeleted = activeMessage.is_deleted;
    const actions: MessageAction[] = [
      { key: "reply", label: t("chat.reply"), icon: "return-up-back-outline" },
      { key: "forward", label: t("chat.forward"), icon: "arrow-redo-outline" },
      { key: "react", label: t("chat.addReaction"), icon: "happy-outline" },
    ];
    if (!isDeleted) {
      actions.push({ key: "copy", label: t("chat.copy"), icon: "copy-outline" });
    }
    if (isOwn && !isDeleted) {
      actions.push({ key: "edit", label: t("chat.edit"), icon: "pencil-outline" });
      actions.push({ key: "delete", label: t("chat.delete"), icon: "trash-outline", destructive: true });
    }
    if (activeMessage.is_edited) {
      actions.push({ key: "history", label: t("chat.viewEditHistory"), icon: "time-outline" });
    }
    const isPinned = pinnedMessages?.some((p) => p.message_id === activeMessage.id);
    actions.push({
      key: "pin",
      label: isPinned ? t("chat.unpin") : t("chat.pin"),
      icon: isPinned ? "pin-outline" : "pin",
    });
    return actions;
  }, [activeMessage, currentUserId, pinnedMessages, t]);

  const handleActionSelect = useCallback(
    (action: MessageAction["key"]) => {
      if (!activeMessage) return;
      switch (action) {
        case "reply":
          setReplyToMessage(activeMessage);
          break;
        case "copy":
          Clipboard.setString(activeMessage.content);
          break;
        case "react":
          setEmojiPickerVisible(true);
          break;
        case "forward":
          setForwardMessage(activeMessage);
          break;
        case "edit":
          setEditText(activeMessage.content);
          setEditMessage(activeMessage);
          break;
        case "delete":
          Alert.alert(t("chat.deleteConfirmTitle"), t("chat.deleteConfirm"), [
            { text: t("common.cancel"), style: "cancel" },
            {
              text: t("common.delete"),
              style: "destructive",
              onPress: () => deleteMessageMutate(activeMessage.id),
            },
          ]);
          break;
        case "pin": {
          const isPinned = pinnedMessages?.some((p) => p.message_id === activeMessage.id);
          if (isPinned) unpinMessageMutate(activeMessage.id);
          else pinMessageMutate(activeMessage.id);
          break;
        }
        case "history":
          setEditHistoryMessageId(activeMessage.id);
          break;
      }
    },
    [activeMessage, deleteMessageMutate, pinMessageMutate, unpinMessageMutate, pinnedMessages, t],
  );

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      setEmojiPickerVisible(false);
      if (activeMessage) {
        handleReactionPress(activeMessage, emoji);
      }
    },
    [activeMessage, handleReactionPress],
  );

  const handleEditSubmit = useCallback(() => {
    if (!editMessage || !editText.trim()) return;
    editMessageMutate({ messageId: editMessage.id, content: editText.trim() });
    setEditMessage(null);
    setEditText("");
  }, [editMessage, editText, editMessageMutate]);

  const handleForward = useCallback(
    (targetRoomId: string) => {
      if (!forwardMessage) return;
      getWsClient().send("ChatMessage", {
        room_id: targetRoomId,
        content: forwardMessage.content,
        message_type: forwardMessage.message_type ?? "text",
        reply_to: null,
        file_url: forwardMessage.file_url ?? null,
      });
      setForwardMessage(null);
    },
    [forwardMessage],
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
        roomName={room.name ?? t("chat.title")}
        memberCount={room.member_count}
        onBack={() => router.back()}
        onSearch={() => setSearchVisible(true)}
        onManage={() => router.push(`/room/${roomId}/manage` as any)}
      />

      {/* Search overlay */}
      {searchVisible && (
        <View className="mx-4 mb-2 mt-2">
          <View className="flex-row items-center gap-2 rounded-xl border border-purple bg-surface px-3 py-2">
            <Ionicons name="search" size={16} color={colors.ink3} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t("chat.searchMessagesPlaceholder")}
              placeholderTextColor={colors.ink4}
              className="flex-1 text-[13px] text-ink"
              autoCapitalize="none"
              returnKeyType="search"
              onSubmitEditing={() => {
                if (searchQuery.trim() && roomId) {
                  searchMessages({ query: searchQuery, roomId });
                }
              }}
            />
            {searching && <ActivityIndicator size="small" color={colors.purple} />}
            {searchQuery.length > 0 && (
              <Pressable onPress={() => { setSearchQuery(""); setSearchVisible(false); }}>
                <Ionicons name="close" size={18} color={colors.ink3} />
              </Pressable>
            )}
          </View>
          {searchResults && searchResults.length > 0 && (
            <View className="mb-2 mt-2 flex-row gap-2">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
                <Pressable
                  onPress={() => {
                    setSearchDateDays(null);
                    setSearchNow(Date.now());
                  }}
                  className={`mr-2 rounded-full px-3 py-1 ${searchDateDays === null ? "bg-purple" : "bg-surface-alt"}`}
                >
                  <Text className={`text-[11px] font-sans-semibold ${searchDateDays === null ? "text-white" : "text-ink-3"}`}>{t("chat.all")}</Text>
                </Pressable>
                {[1, 7, 30].map((days) => (
                  <Pressable
                    key={days}
                    onPress={() => {
                      setSearchDateDays(days);
                      setSearchNow(Date.now());
                    }}
                    className={`mr-2 rounded-full px-3 py-1 ${searchDateDays === days ? "bg-purple" : "bg-surface-alt"}`}
                  >
                    <Text className={`text-[11px] font-sans-semibold ${searchDateDays === days ? "text-white" : "text-ink-3"}`}>
                      {days === 1 ? t("common.today") : t("chat.days", { days })}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {searchResults && searchResults.length > 0 && (
            <View className="mb-2 flex-row gap-2">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Pressable
                  onPress={() => setSearchSender(null)}
                  className={`mr-2 rounded-full px-3 py-1 ${searchSender === null ? "bg-purple" : "bg-surface-alt"}`}
                >
                  <Text className={`text-[11px] font-sans-semibold ${searchSender === null ? "text-white" : "text-ink-3"}`}>{t("chat.all")}</Text>
                </Pressable>
                {Array.from(new Map((searchResults as Message[]).map((m) => [m.sender?.id, m.sender])).entries())
                  .filter(([id]) => id)
                  .map(([id, sender]) => (
                    <Pressable
                      key={id}
                      onPress={() => setSearchSender(id === searchSender ? null : id)}
                      className={`mr-2 rounded-full px-3 py-1 ${searchSender === id ? "bg-purple" : "bg-surface-alt"}`}
                    >
                      <Text className={`text-[11px] font-sans-semibold ${searchSender === id ? "text-white" : "text-ink-3"}`}>
                        {sender?.username}
                      </Text>
                    </Pressable>
                  ))}
              </ScrollView>
            </View>
          )}

          {filteredSearchResults && filteredSearchResults.length > 0 && (
            <View className="mt-2 max-h-48 overflow-hidden rounded-xl border border-border-soft bg-surface">
              <ScrollView>
                {filteredSearchResults.slice(0, 20).map((msg) => (
                  <Pressable
                    key={msg.id}
                    className="flex-row items-center gap-2 border-b border-border-soft px-3 py-2.5 last:border-0 active:bg-surface-alt"
                  >
                    <View className="flex-1">
                      <Text className="text-[11px] font-sans-semibold text-ink">
                        {msg.sender?.username ?? t("common.unknown")}
                      </Text>
                      <Text className="text-[12px] leading-[1.3] text-ink-3" numberOfLines={2}>
                        {msg.content}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
          {filteredSearchResults && filteredSearchResults.length === 0 && searchQuery.length > 0 && !searching && (
            <Text className="mt-2 text-center text-[12px] text-ink-4">{t("chat.noSearchResults")}</Text>
          )}
        </View>
      )}

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
            const isNewDay =
              !prevMsg || new Date(item.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();

            return (
              <View className="px-4">
                {isNewDay && <DateDivider date={new Date(item.created_at).toLocaleDateString()} />}
                <MessageBubble
                  message={item}
                  isOwn={isOwn}
                  showHeader={showHeader}
                  currentUserId={currentUserId}
                  readBy={readByMap[item.id]}
                  onLongPress={() => handleLongPress(item)}
                  onReactionPress={(emoji) => handleReactionPress(item, emoji)}
                  onImagePress={setViewerUri}
                />
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
              {pendingMessages.map((pending) => {
                const msg: Message = {
                  id: pending.id,
                  room_id: roomId ?? "",
                  sender: { id: currentUserId ?? "", username: t("chat.you"), avatar_url: null },
                  content: pending.content,
                  message_type: pending.message_type,
                  reply_to: pending.reply_to,
                  reply_to_message: null,
                  file_url: pending.file_url,
                  is_deleted: false,
                  created_at: new Date(pending.createdAt).toISOString(),
                };
                return (
                  <View key={pending.id} className="px-4">
                    <MessageBubble
                      message={msg}
                      isOwn
                      showHeader={false}
                      currentUserId={currentUserId}
                      sendingStatus={pending.status}
                      onRetry={() => handleRetryPending(pending)}
                    />
                  </View>
                );
              })}
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

        <ChatInput
          roomId={roomId ?? ""}
          onSend={handleSend}
          replyTo={replyToMessage}
          onCancelReply={() => setReplyToMessage(null)}
        />
      </KeyboardAvoidingView>

      <MessageActionsSheet
        visible={actionSheetVisible}
        actions={availableActions}
        onSelect={handleActionSelect}
        onClose={() => {
          setActionSheetVisible(false);
          if (!emojiPickerVisible) setActiveMessage(null);
        }}
      />

      <EmojiPicker
        visible={emojiPickerVisible}
        onSelect={handleEmojiSelect}
        onClose={() => {
          setEmojiPickerVisible(false);
          setActiveMessage(null);
        }}
      />

      <ImageViewer
        uri={viewerUri}
        visible={!!viewerUri}
        onClose={() => setViewerUri(null)}
      />

      <ForwardModal
        visible={!!forwardMessage}
        onSelect={handleForward}
        onClose={() => setForwardMessage(null)}
      />

      <EditHistoryModal
        messageId={editHistoryMessageId}
        visible={!!editHistoryMessageId}
        onClose={() => setEditHistoryMessageId(null)}
      />

      {/* Edit message modal */}
      <Modal
        visible={!!editMessage}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setEditMessage(null);
          setEditText("");
        }}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full rounded-2xl bg-surface p-4">
            <Text className="mb-3 text-[16px] font-sans-semibold text-ink">{t("chat.editMessage")}</Text>
            <TextInput
              value={editText}
              onChangeText={setEditText}
              className="max-h-40 rounded-xl border border-border bg-cream p-3 text-[14px] text-ink"
              multiline
              autoFocus
            />
            <View className="mt-4 flex-row justify-end gap-2">
              <Pressable
                onPress={() => {
                  setEditMessage(null);
                  setEditText("");
                }}
                className="rounded-xl bg-surface-alt px-4 py-2.5 active:opacity-80"
              >
                <Text className="text-[14px] font-sans-semibold text-ink">{t("common.cancel")}</Text>
              </Pressable>
              <Pressable
                onPress={handleEditSubmit}
                disabled={!editText.trim()}
                className="rounded-xl bg-purple px-4 py-2.5 active:opacity-80 disabled:opacity-50"
              >
                <Text className="text-[14px] font-sans-semibold text-white">{t("common.save")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
