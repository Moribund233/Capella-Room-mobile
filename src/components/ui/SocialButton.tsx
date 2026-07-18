/**
 * Social login button placeholder (Google / GitHub).
 */

import { Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type SocialProvider = "google" | "github";

interface SocialButtonProps {
  /** Social provider to display. */
  provider: SocialProvider;
  /** Called when the button is pressed. */
  onPress?: () => void;
}

const config: Record<
  SocialProvider,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  google: {
    label: "Google",
    icon: "logo-google",
    color: "#4285F4",
  },
  github: {
    label: "GitHub",
    icon: "logo-github",
    color: "#333333",
  },
};

/**
 * Render a social login button.
 *
 * @param props - Social button props.
 * @returns A React element.
 */
export function SocialButton({ provider, onPress }: SocialButtonProps) {
  const { label, icon, color } = config[provider];

  return (
    <Pressable
      onPress={onPress}
      className="flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface py-3 active:bg-surface-alt"
    >
      <Ionicons name={icon} size={16} color={color} />
      <Text className="text-[13px] font-sans-medium text-ink-2">{label}</Text>
    </Pressable>
  );
}
