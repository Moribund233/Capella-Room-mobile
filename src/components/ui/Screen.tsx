/**
 * Screen wrapper that combines SafeArea, keyboard avoidance and scrolling.
 */

import { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ScreenProps {
  /** Screen content. */
  children: ReactNode;
  /** Additional styles for the scroll content container. */
  contentContainerStyle?: ViewStyle;
  /** Background color token. */
  background?: "cream" | "surface";
}

/**
 * Render a scrollable screen within the safe area.
 *
 * @param props - Screen props.
 * @returns A React element.
 */
export function Screen({
  children,
  contentContainerStyle,
  background = "cream",
}: ScreenProps) {
  const bgClass = background === "surface" ? "bg-surface" : "bg-cream";

  return (
    <SafeAreaView className={`flex-1 ${bgClass}`}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            ...contentContainerStyle,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
