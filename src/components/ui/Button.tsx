/**
 * Generic button with primary / secondary / outline variants.
 */

import { Text, ActivityIndicator, type PressableProps } from "react-native";

import { ScalePress } from "./animations/ScalePress";

type ButtonVariant = "primary" | "secondary" | "outline";

interface ButtonProps extends Omit<
  PressableProps,
  "onPress" | "onLongPress" | "onPressIn" | "onPressOut" | "style"
> {
  /** Button label. */
  title: string;
  /** Visual variant. */
  variant?: ButtonVariant;
  /** Show a loading spinner and disable interactions. */
  loading?: boolean;
  /** Called when the user presses the button. */
  onPress?: () => void;
  /** Called when the user long-presses the button. */
  onLongPress?: () => void;
}

/**
 * Render a styled pressable button.
 *
 * @param props - Button props.
 * @returns A React element.
 */
export function Button({
  title,
  variant = "primary",
  loading = false,
  disabled,
  onPress,
  onLongPress,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const baseClasses = "w-full items-center justify-center rounded-2xl py-4";
  const variantClasses = {
    primary: "bg-purple shadow-lg",
    secondary: "bg-purple-light",
    outline: "border border-border bg-surface",
  };
  const textClasses = {
    primary: "text-white",
    secondary: "text-purple",
    outline: "text-ink-2",
  };

  return (
    <ScalePress
      disabled={isDisabled}
      className={`${baseClasses} ${variantClasses[variant]} ${isDisabled ? "opacity-60" : ""}`}
      onPress={onPress}
      onLongPress={onLongPress}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#FFFFFF" : "#2563EB"} />
      ) : (
        <Text className={`text-[15px] font-sans-semibold ${textClasses[variant]}`}>
          {title}
        </Text>
      )}
    </ScalePress>
  );
}
