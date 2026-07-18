/**
 * Theme provider.
 *
 * Resolves the active theme (light / dark / system) and applies the
 * `dark` class to the native root view so that NativeWind CSS variables
 * switch automatically.
 */

import { useEffect, type ReactNode } from "react";
import { View, Appearance, type ColorSchemeName } from "react-native";
import { useThemeStore } from "@/lib/store/theme";

interface ThemeProviderProps {
  children: ReactNode;
}

function normalizeColorScheme(scheme: ColorSchemeName | null): "light" | "dark" | null {
  if (scheme === "light" || scheme === "dark") return scheme;
  return null;
}

/**
 * Provide resolved theme context to the app shell.
 *
 * @param props.children - Child elements.
 * @returns A React element.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const mode = useThemeStore((s) => s.mode);
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const resolve = useThemeStore((s) => s.resolve);

  useEffect(() => {
    // Hydrate store after initial render so system mode is resolved correctly.
    const scheme = Appearance.getColorScheme() ?? null;
    resolve(normalizeColorScheme(scheme));
  }, [resolve]);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      resolve(normalizeColorScheme(colorScheme));
    });
    return () => subscription.remove();
  }, [resolve]);

  useEffect(() => {
    resolve(null);
  }, [mode, resolve]);

  return (
    <View className={resolvedTheme === "dark" ? "dark" : ""} style={{ flex: 1 }}>
      {children}
    </View>
  );
}
