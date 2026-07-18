/**
 * Authentication screen entry point.
 *
 * Only responsible for tab state and wiring form submissions to the auth
 * store. All presentation is delegated to components in `components/ui` and
 * `components/auth`.
 */

import { useState, useCallback, useEffect } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/lib/store/auth";
import { Screen } from "@/components/ui/Screen";
import { Logo } from "@/components/ui/Logo";
import { Handwriting } from "@/components/ui/Handwriting";
import { TabSwitcher } from "@/components/ui/TabSwitcher";
import { AuthBackground } from "@/components/auth/AuthBackground";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";

type AuthTab = "login" | "register";

/**
 * Render the authentication screen.
 *
 * @returns A React element.
 */
export default function AuthScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (user) {
      router.replace("/(tabs)");
    }
  }, [user, router]);

  const onLogin = useCallback(
    async (data: { email: string; password: string }) => {
      await login(data.email, data.password);
    },
    [login],
  );

  const onRegister = useCallback(
    async (data: { username: string; email: string; password: string }) => {
      await register(data.username, data.email, data.password);
    },
    [register],
  );

  return (
    <Screen
      background="cream"
      contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 40 }}
    >
      <AuthBackground />
      <View className="z-10 flex-1 pt-8">
        <Logo />

        <View className="mb-9">
          <Text className="font-display-bold text-[30px] leading-[34px] tracking-tight text-ink">
            {t("auth.tagline")}
          </Text>
          <Text className="mt-2.5 text-[14px] leading-[22px] text-ink-3">
            {t("auth.subtitle")}
          </Text>
          <Handwriting>{t("auth.handwriting")}</Handwriting>
        </View>

        <TabSwitcher active={activeTab} onSwitch={setActiveTab} />

        {activeTab === "login" ? (
          <LoginForm onSubmit={onLogin} isLoading={isLoading} />
        ) : (
          <RegisterForm onSubmit={onRegister} isLoading={isLoading} />
        )}
      </View>
    </Screen>
  );
}
