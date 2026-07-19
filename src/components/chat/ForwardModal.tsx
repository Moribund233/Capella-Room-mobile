/**
 * Modal for forwarding a message to another room.
 */

import { Modal, View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "@/lib/hooks/useThemeColors";
import { useRooms } from "@/lib/hooks/useRoomsQuery";

interface ForwardModalProps {
  /** Whether the modal is visible. */
  visible: boolean;
  /** Called when a target room is selected. */
  onSelect: (roomId: string) => void;
  /** Called when the modal is dismissed. */
  onClose: () => void;
}

/**
 * Render a room selector for message forwarding.
 *
 * @param props - Modal props.
 * @returns A React element.
 */
export function ForwardModal({ visible, onSelect, onClose }: ForwardModalProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { data: rooms, isLoading } = useRooms();

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
          <Text className="text-[16px] font-sans-semibold text-ink">{t("chat.forwardTo")}</Text>
          <Pressable onPress={onClose} className="h-8 w-8 items-center justify-center rounded-full active:bg-surface-alt">
            <Ionicons name="close" size={20} color={colors.ink3} />
          </Pressable>
        </View>
        {isLoading ? (
          <View className="py-8">
            <ActivityIndicator size="small" color={colors.purple} />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {(rooms ?? []).map((room) => (
              <Pressable
                key={room.id}
                onPress={() => onSelect(room.id)}
                className="flex-row items-center gap-3 border-b border-border-soft py-3 last:border-0 active:bg-surface-alt"
              >
                <View
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: colors.purpleLight }}
                >
                  <Text className="text-[13px] font-sans-semibold" style={{ color: colors.purple }}>
                    {room.name.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[14px] font-sans-semibold text-ink" numberOfLines={1}>
                    {room.name}
                  </Text>
                  <Text className="text-[11px] text-ink-4">{room.member_count} {t("common.members")}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.ink4} />
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
