/**
 * Date divider used between messages from different days.
 */

import { View, Text } from "react-native";
import { formatChatDateLabel } from "@/lib/utils/groupMessages";

interface DateDividerProps {
  isoDate: string;
}

/**
 * @param props - Component props.
 * @returns A centered date pill.
 */
export function DateDivider({ isoDate }: DateDividerProps) {
  return (
    <View className="my-3 items-center">
      <View className="rounded-full bg-surface px-3 py-1 shadow-xs">
        <Text className="text-xs font-sans-medium text-ink-3">
          {formatChatDateLabel(isoDate)}
        </Text>
      </View>
    </View>
  );
}
