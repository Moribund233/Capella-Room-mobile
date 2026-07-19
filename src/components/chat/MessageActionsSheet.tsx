/**
 * Action sheet shown on long-press of a message bubble.
 */

import { Modal, View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "@/lib/hooks/useThemeColors";
import { Ionicons } from "@expo/vector-icons";

export interface MessageAction {
  /** Unique action key. */
  key: "reply" | "copy" | "react" | "edit" | "delete" | "pin" | "forward" | "history";
  /** Display label. */
  label: string;
  /** Optional icon name from Ionicons. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Whether this action should be rendered in a destructive style. */
  destructive?: boolean;
}

interface MessageActionsSheetProps {
  /** Whether the sheet is visible. */
  visible: boolean;
  /** Actions to display. */
  actions: MessageAction[];
  /** Called when an action is selected. */
  onSelect: (key: MessageAction["key"]) => void;
  /** Called when the sheet is dismissed. */
  onClose: () => void;
}

/**
 * Render a bottom action sheet for message interactions.
 *
 * @param props - Sheet props.
 * @returns A React element.
 */
export function MessageActionsSheet({ visible, actions, onSelect, onClose }: MessageActionsSheetProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/30" onPress={onClose}>
        <View className="flex-1" />
      </Pressable>
      <View
        className="rounded-t-3xl px-4 pb-6 pt-3 shadow-xl"
        style={{ backgroundColor: colors.surface }}
      >
        <View className="mb-2 flex-row justify-center">
          <View className="h-1 w-10 rounded-full bg-ink-4/30" />
        </View>
        {actions.map((action, index) => (
          <Pressable
            key={action.key}
            onPress={() => {
              onSelect(action.key);
              onClose();
            }}
            className={`flex-row items-center gap-3 px-2 py-3.5 ${
              index < actions.length - 1 ? "border-b border-border-soft" : ""
            }`}
          >
            {action.icon && (
              <Ionicons
                name={action.icon}
                size={20}
                color={action.destructive ? "#EF4444" : colors.ink2}
              />
            )}
            <Text
              className={`flex-1 text-[15px] font-sans-medium ${
                action.destructive ? "text-red-500" : "text-ink"
              }`}
            >
              {action.label}
            </Text>
          </Pressable>
        ))}
        <Pressable
          onPress={onClose}
          className="mt-3 items-center justify-center rounded-2xl bg-surface-alt py-3.5 active:opacity-80"
        >
          <Text className="text-[15px] font-sans-semibold text-ink">{t("common.cancel")}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
