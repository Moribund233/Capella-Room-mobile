/**
 * i18n configuration.
 *
 * Supports Simplified Chinese (default) and English (US). Resources are
 * imported statically so that Metro can tree-shake unused keys in production.
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import zhCN from "./locales/zh-CN";
import enUS from "./locales/en-US";

export const defaultNS = "translation";

export const resources = {
  "zh-CN": { [defaultNS]: zhCN },
  "en-US": { [defaultNS]: enUS },
} as const;

export type SupportedLocale = keyof typeof resources;

export const supportedLocales: SupportedLocale[] = ["zh-CN", "en-US"];

export const localeLabels: Record<SupportedLocale, string> = {
  "zh-CN": "简体中文",
  "en-US": "English (US)",
};

// i18next exposes a `use()` plugin API; it is not a React Hook.
// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  resources,
  lng: "zh-CN",
  fallbackLng: "zh-CN",
  defaultNS,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
