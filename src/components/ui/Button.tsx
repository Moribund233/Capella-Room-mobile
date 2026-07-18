/**
 * Generic button with primary / secondary / outline variants.
 */

import { Pressable, Text, ActivityIndicator, type PressableProps } from "react-native";

type ButtonVariant = "primary" | "secondary" | "outline";

interface ButtonProps extends PressableProps {
  /** Button label. */
  title: string;
  /** Visual variant. */
  variant?: ButtonVariant;
  /** Show a loading spinner and disable interactions. */
  loading?: boolean;
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
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const baseClasses =
    "w-full items-center justify-center rounded-2xl py-4 active:scale-97";
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
    <Pressable
      disabled={isDisabled}
      className={`${baseClasses} ${variantClasses[variant]} ${isDisabled ? "opacity-60" : ""}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#FFFFFF" : "#2563EB"} />
      ) : (
        <Text className={`text-[15px] font-sans-semibold ${textClasses[variant]}`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
