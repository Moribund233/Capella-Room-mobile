/**
 * Simple emoji picker modal for adding reactions to messages.
 */

import { Modal, View, Text, Pressable, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "@/lib/hooks/useThemeColors";
import { Ionicons } from "@expo/vector-icons";

interface EmojiPickerProps {
  /** Whether the picker is visible. */
  visible: boolean;
  /** Called when the user selects an emoji. */
  onSelect: (emoji: string) => void;
  /** Called when the user dismisses the picker without selecting. */
  onClose: () => void;
}

/** Common reaction emojis grouped by sentiment. */
const EMOJI_GROUPS = [
  ["👍", "❤️", "😂", "😮", "😢", "😡", "🎉"],
  ["👏", "🔥", "💯", "🤔", "🙏", "👌", "🤷"],
  ["😀", "😭", "🤣", "🥳", "😍", "🤯", "😴"],
  ["🚀", "🌈", "⭐", "☀️", "🌙", "⚡", "🌸"],
];

/**
 * Render a modal emoji grid.
 *
 * @param props - Picker props.
 * @returns A React element.
 */
export function EmojiPicker({ visible, onSelect, onClose }: EmojiPickerProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/30" onPress={onClose}>
        <View className="flex-1" />
      </Pressable>
      <View
        className="rounded-t-3xl px-4 pb-6 pt-4 shadow-xl"
        style={{ backgroundColor: colors.surface }}
      >
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-[16px] font-sans-semibold text-ink">
            {t("chat.addReaction")}
          </Text>
          <Pressable onPress={onClose} className="h-8 w-8 items-center justify-center rounded-full active:bg-surface-alt">
            <Ionicons name="close" size={20} color={colors.ink3} />
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {EMOJI_GROUPS.map((group, groupIndex) => (
            <View key={groupIndex} className="mb-3 flex-row justify-between">
              {group.map((emoji) => (
                <Pressable
                  key={emoji}
                  onPress={() => onSelect(emoji)}
                  className="h-12 w-12 items-center justify-center rounded-2xl active:bg-surface-alt"
                >
                  <Text style={{ fontSize: 26 }}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}
