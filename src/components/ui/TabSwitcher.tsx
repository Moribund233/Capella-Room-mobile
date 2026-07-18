/**
 * Segmented tab switcher used on the authentication screen.
 */

import { View, Pressable, Text } from "react-native";
import { useTranslation } from "react-i18next";

type AuthTab = "login" | "register";

interface TabSwitcherProps {
  /** Currently active tab. */
  active: AuthTab;
  /** Called when the user selects a tab. */
  onSwitch: (tab: AuthTab) => void;
}

/**
 * Render login / register tabs.
 *
 * @param props - Tab switcher props.
 * @returns A React element.
 */
export function TabSwitcher({ active, onSwitch }: TabSwitcherProps) {
  const { t } = useTranslation();
  const tabs: { key: AuthTab; label: string }[] = [
    { key: "login", label: t("auth.signIn") },
    { key: "register", label: t("auth.createAccount") },
  ];

  return (
    <View className="mb-6 flex-row rounded-[14px] bg-surface-alt p-1">
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onSwitch(tab.key)}
            className={`flex-1 items-center rounded-[11px] py-2.5 ${
              isActive ? "bg-surface" : ""
            }`}
          >
            <Text
              className={`text-[13px] font-sans-semibold ${
                isActive ? "text-ink" : "text-ink-3"
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
