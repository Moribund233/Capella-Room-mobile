/**
 * Pressable wrapper that adds a subtle scale-down feedback on press.
 *
 * Animations are automatically disabled when the user has enabled reduced
 * motion or the system requests reduced motion.
 */

import type { ComponentType } from "react";
import type { PressableProps } from "react-native";
import { cssInterop } from "nativewind";
import { MotiPressable } from "moti/interactions";
import type { MotiPressableProps } from "moti/interactions";

import { useAnimationDisabled } from "@/lib/hooks/useAnimationDisabled";

const InteropPressable = cssInterop(MotiPressable, {
  className: "style",
}) as ComponentType<MotiPressableProps & { className?: string }>;

interface ScalePressProps {
  /** Scale multiplier when pressed. Defaults to 0.96. */
  scale?: number;
  /** Content rendered inside the pressable. */
  children: React.ReactNode;
  /** Additional CSS classes (NativeWind). */
  className?: string;
  /** Disable press interactions. */
  disabled?: boolean;
  /** Callback when the press is released. */
  onPress?: () => void;
  /** Callback when a long press is detected. */
  onLongPress?: () => void;
  /** Callback when the press starts. */
  onPressIn?: () => void;
  /** Callback when the press ends. */
  onPressOut?: () => void;
  /** Test ID for tests. */
  testID?: string;
  /** Accessibility role. */
  accessibilityRole?: PressableProps["accessibilityRole"];
  /** Accessibility label. */
  accessibilityLabel?: string;
}

/**
 * Render a pressable with press scale feedback.
 *
 * @param props - Scale press props.
 * @returns A React element.
 */
export function ScalePress({
  children,
  scale = 0.96,
  className,
  disabled,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  testID,
  accessibilityRole,
  accessibilityLabel,
}: ScalePressProps) {
  const animationDisabled = useAnimationDisabled();

  return (
    <InteropPressable
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      testID={testID}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      animate={({ pressed }: { pressed: boolean }) => ({
        scale: disabled || animationDisabled ? 1 : pressed ? scale : 1,
      })}
      transition={{ type: "timing", duration: 100 }}
      className={className}
    >
      {children}
    </InteropPressable>
  );
}
