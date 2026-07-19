/**
 * Modal displaying the edit history of a message.
 */

import {
  Modal,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/lib/hooks/useThemeColors";
import { useMessageEditHistory } from "@/lib/hooks/useMessagesQuery";
import { formatMessageTime } from "@/lib/utils/date";

interface EditHistoryModalProps {
  /** The message id whose edit history is shown. */
  messageId: string | null;
  /** Whether the modal is visible. */
  visible: boolean;
  /** Called when the modal should be closed. */
  onClose: () => void;
}

/**
 * Render a modal listing all historical versions of an edited message.
 *
 * @param props - Modal props.
 * @returns A React element.
 */
export function EditHistoryModal({ messageId, visible, onClose }: EditHistoryModalProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { data: history, isLoading } = useMessageEditHistory(messageId ?? "");

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/30" onPress={onClose}>
        <View className="flex-1" />
      </Pressable>
      <View
        className="max-h-[70%] rounded-t-3xl px-4 pb-6 pt-3 shadow-xl"
        style={{ backgroundColor: colors.surface }}
      >
        <View className="mb-2 flex-row justify-center">
          <View className="h-1 w-10 rounded-full bg-ink-4/30" />
        </View>
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-[16px] font-display-bold text-ink">
            {t("chat.editHistoryTitle")}
          </Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={22} color={colors.ink2} />
          </Pressable>
        </View>

        {isLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator color={colors.purple} />
          </View>
        ) : !history || history.length === 0 ? (
          <Text className="py-6 text-center text-[13px] text-ink-3">
            {t("chat.noEditHistory")}
          </Text>
        ) : (
          <ScrollView className="max-h-[50%]">
            {history.map((entry, index) => {
              const isLatest = index === 0;
              return (
                <View
                  key={entry.id}
                  className="mb-3 rounded-2xl border border-border-soft bg-surface-alt p-3"
                >
                  <View className="mb-1.5 flex-row items-center justify-between">
                    <Text className="text-[11px] font-sans-semibold text-ink">
                      {entry.editor.username}
                    </Text>
                    <Text className="text-[10px] text-ink-4">
                      {formatMessageTime(entry.created_at)}
                      {isLatest ? ` · ${t("chat.latestEdit")}` : ""}
                    </Text>
                  </View>
                  <Text className="mb-1 text-[12px] text-ink-4 line-through">
                    {entry.old_content}
                  </Text>
                  <Text className="text-[13px] text-ink">{entry.new_content}</Text>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
