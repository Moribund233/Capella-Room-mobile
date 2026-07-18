/**
 * Form input with label, error message and focus state.
 */

import { View, Text, TextInput, type TextInputProps } from "react-native";

interface InputProps extends TextInputProps {
  /** Input label shown above the field. */
  label: string;
  /** Optional validation error message. */
  error?: string;
}

/**
 * Render a labeled text input.
 *
 * @param props - Input props forwarded to the underlying TextInput.
 * @returns A React element.
 */
export function Input({ label, error, ...textInputProps }: InputProps) {
  return (
    <View>
      <Text className="mb-1.5 text-[11px] font-sans-semibold uppercase tracking-wide text-ink-3">
        {label}
      </Text>
      <TextInput
        placeholderTextColor="#CBD5E1"
        className={`w-full rounded-2xl border-[1.5px] bg-surface px-4 py-3 text-[14px] text-ink ${
          error ? "border-rose" : "border-border"
        }`}
        {...textInputProps}
      />
      {error ? <Text className="ml-0.5 mt-1 text-[11px] text-rose">{error}</Text> : null}
    </View>
  );
}
