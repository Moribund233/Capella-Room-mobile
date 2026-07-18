/**
 * Language preference store.
 *
 * Wraps i18next so that locale changes are persisted and reflected
 * immediately across the app.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { secureStorage } from "@/lib/storage/secureStorage";
import i18n, { type SupportedLocale } from "@/lib/i18n";

interface LanguageState {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      locale: "zh-CN",

      setLocale: (locale) => {
        i18n.changeLanguage(locale);
        set({ locale });
      },
    }),
    {
      name: "capella-language",
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({ locale: state.locale }),
      onRehydrateStorage: () => (state) => {
        if (state?.locale) {
          i18n.changeLanguage(state.locale);
        }
      },
    },
  ),
);
