/**
 * Decorative handwritten text using the Caveat font.
 */

import { Text } from "react-native";

interface HandwritingProps {
  /** Text content. */
  children: string;
}

/**
 * Render a stylized handwritten caption.
 *
 * @param props - Handwriting props.
 * @returns A React element.
 */
export function Handwriting({ children }: HandwritingProps) {
  return (
    <Text
      className="mt-3 font-hand text-[20px] text-purple"
      style={{ transform: [{ rotate: "-1deg" }] }}
    >
      {children}
    </Text>
  );
}
