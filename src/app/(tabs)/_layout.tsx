import { Tabs, useRouter, useSegments, type Href } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "@/lib/hooks/useThemeColors";

const TABS = [
  { name: "index", icon: "chatbubbles", labelKey: "tabs.chats" as const },
  { name: "discover", icon: "compass", labelKey: "tabs.discover" as const },
  { name: "notifications", icon: "notifications", labelKey: "tabs.alerts" as const },
  { name: "profile", icon: "person", labelKey: "tabs.profile" as const },
];

function CustomTabBar() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const segments = useSegments();
  const currentTab = segments.at(-1) ?? "index";

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.borderSoft,
        paddingBottom: insets.bottom,
        height: 56 + insets.bottom,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      {TABS.map((tab) => {
        const isActive = currentTab === tab.name;
        return (
          <Pressable
            key={tab.name}
            onPress={() => {
              const href = tab.name === "index" ? "/(tabs)" as Href : `/(tabs)/${tab.name}` as Href;
              if (currentTab !== tab.name) router.replace(href);
            }}
            className="flex-1 items-center justify-center"
            style={{ paddingTop: 6 }}
          >
            <Ionicons
              name={`${tab.icon}-outline` as any}
              size={22}
              color={isActive ? colors.purple : colors.ink3}
            />
            <Text
              className="text-[10px] font-sans-semibold"
              style={{ color: isActive ? colors.purple : colors.ink3, marginTop: 0 }}
            >
              {t(tab.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={() => <CustomTabBar />}
    >
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} />
      ))}
    </Tabs>
  );
}
