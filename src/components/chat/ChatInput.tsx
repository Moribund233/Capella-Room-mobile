/**
 * Message composer at the bottom of the chat screen.
 */

import { useState } from "react";
import { View, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/lib/hooks/useThemeColors";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

/**
 * @param props - Component props.
 * @returns The chat input bar.
 */
export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const colors = useThemeColors();
  const [text, setText] = useState("");

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <View className="border-t border-border bg-cream px-4 pb-5 pt-3">
      <View className="flex-row items-end gap-2 rounded-2xl border border-border bg-surface p-2 shadow-sm">
        <Pressable className="h-10 w-10 items-center justify-center rounded-full">
          <Ionicons name="attach" size={22} color={colors.ink3} />
        </Pressable>

        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Message..."
          placeholderTextColor={colors.ink3}
          multiline
          maxLength={2000}
          className="max-h-32 flex-1 px-1 py-2 text-base text-ink"
          editable={!disabled}
          onSubmitEditing={handleSend}
        />

        <Pressable
          onPress={handleSend}
          disabled={!text.trim() || disabled}
          className={`h-10 w-10 items-center justify-center rounded-full ${text.trim() ? "bg-purple" : "bg-surface-alt"}`}
        >
          <Ionicons name="send" size={18} color={text.trim() ? "#FFFFFF" : colors.ink3} />
        </Pressable>
      </View>
    </View>
  );
}
