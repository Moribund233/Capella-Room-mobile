/**
 * Horizontal divider with centered label.
 */

import { View, Text } from "react-native";

interface DividerProps {
  /** Label shown between the divider lines. */
  label: string;
}

/**
 * Render a labeled divider.
 *
 * @param props - Divider props.
 * @returns A React element.
 */
export function Divider({ label }: DividerProps) {
  return (
    <View className="my-1 flex-row items-center gap-3">
      <View className="h-px flex-1 bg-border" />
      <Text className="text-[11px] text-ink-4">{label}</Text>
      <View className="h-px flex-1 bg-border" />
    </View>
  );
}
