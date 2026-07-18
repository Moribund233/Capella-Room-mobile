/**
 * Hook returning the current theme's color palette.
 *
 * Use this for programmatic colors (e.g. vector icon `color` props or
 * React Native animated values) where a NativeWind class cannot be used.
 */

import { useThemeStore } from "@/lib/store/theme";
import { lightColors, darkColors } from "@/theme";

/**
 * @returns The active theme's color object.
 */
export function useThemeColors() {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  return resolvedTheme === "dark" ? darkColors : lightColors;
}
