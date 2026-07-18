import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { secureStorage } from "../storage/secureStorage";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  mode: ThemeMode;
  resolvedTheme: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
  resolve: (systemColorScheme: "light" | "dark" | null) => void;
}

/**
 * Theme store with light / dark / system modes.
 *
 * The `mode` is the user's explicit preference (persisted). The
 * `resolvedTheme` is the actual applied theme after resolving "system"
 * against the OS color scheme.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: "system",
      resolvedTheme: "light",

      setMode: (mode) => {
        set({ mode });
        get().resolve(null);
      },

      toggle: () => {
        const next = get().resolvedTheme === "light" ? "dark" : "light";
        set({ mode: next, resolvedTheme: next });
      },

      resolve: (systemColorScheme) => {
        const { mode } = get();
        if (mode === "system") {
          set({ resolvedTheme: systemColorScheme ?? "light" });
        } else {
          set({ resolvedTheme: mode });
        }
      },
    }),
    {
      name: "capella-theme",
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({ mode: state.mode }),
    },
  ),
);
