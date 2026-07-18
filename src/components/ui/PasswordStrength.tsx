/**
 * Visual password strength indicator.
 */

import { View } from "react-native";

interface PasswordStrengthProps {
  /** Current password value. */
  password: string;
}

/**
 * Render a four-segment strength bar.
 *
 * Segments fill based on length, mixed case, digits and special characters.
 *
 * @param props - Strength indicator props.
 * @returns A React element.
 */
export function PasswordStrength({ password }: PasswordStrengthProps) {
  const levels = [
    password.length >= 4,
    password.length >= 6,
    password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password),
    password.length >= 10 &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password),
  ];

  const segmentColor = (filled: boolean, index: number) => {
    if (!filled) return "bg-border";
    if (index <= 1) return "bg-rose";
    if (index === 2) return "bg-peach";
    return "bg-mint";
  };

  return (
    <View className="mt-1.5 flex-row gap-1">
      {levels.map((filled, i) => (
        <View
          key={i}
          className={`h-[3px] flex-1 rounded-sm ${segmentColor(filled, i)}`}
        />
      ))}
    </View>
  );
}
