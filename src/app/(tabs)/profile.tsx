import { useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/lib/store/auth";
import { useThemeColors } from "@/lib/hooks/useThemeColors";
import { useThemeStore } from "@/lib/store/theme";
import { localeLabels, supportedLocales } from "@/lib/i18n";
import { useLanguageStore } from "@/lib/store/language";
import { useUpdateMe } from "@/lib/hooks/useUsersQuery";
import * as ImagePicker from "expo-image-picker";
import { SettingsDrawer } from "@/components/ui/SettingsDrawer";

function Avatar({ name, size = 72 }: { name?: string; size?: number }) {
  const initial = name?.slice(0, 2).toUpperCase() ?? "?";
  const borderRadius = size * 0.33;
  return (
    <View
      className="relative items-center justify-center overflow-hidden border-4 border-cream"
      style={{
        width: size,
        height: size,
        borderRadius,
        backgroundColor: "#2563EB",
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
      }}
    >
      <Text className="font-sans-bold text-white" style={{ fontSize: size * 0.36 }}>
        {initial}
      </Text>
      <View
        className="absolute -bottom-0.5 -right-0.5 h-6 w-6 items-center justify-center rounded-lg border-2 border-cream"
        style={{ backgroundColor: "#2563EB" }}
      >
        <Ionicons name="camera" size={12} color="white" />
      </View>
    </View>
  );
}

function SettingsItem({
  icon,
  iconBg,
  title,
  subtitle,
  showToggle,
  toggleOn,
  onToggle,
  onPress,
}: {
  icon: string;
  iconBg: string;
  title: string;
  subtitle?: string;
  showToggle?: boolean;
  toggleOn?: boolean;
  onToggle?: (val: boolean) => void;
  onPress?: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 border-b border-border-soft px-3.5 py-3.5 active:bg-surface-alt"
    >
      <View
        className="h-8 w-8 items-center justify-center rounded-xl"
        style={{ backgroundColor: iconBg }}
      >
        <Ionicons name={icon as any} size={15} color={colors.ink} />
      </View>
      <View className="flex-1">
        <Text className="text-[13px] font-sans-medium text-ink">{title}</Text>
        {subtitle && <Text className="mt-0.5 text-[10.5px] text-ink-4">{subtitle}</Text>}
      </View>
      {showToggle ? (
        <Switch
          value={toggleOn}
          onValueChange={onToggle}
          trackColor={{ false: colors.border, true: colors.purple }}
          thumbColor="white"
          style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
        />
      ) : (
        <Ionicons name="chevron-forward" size={16} color={colors.ink4} />
      )}
    </Pressable>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-4 px-5">
      <Text className="mb-2 px-1 text-[11px] font-sans-bold uppercase tracking-wider text-ink-4">
        {title}
      </Text>
      <View className="overflow-hidden rounded-2xl border border-border-soft bg-surface">
        {children}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const setMode = useThemeStore((s) => s.setMode);
  const locale = useLanguageStore((s) => s.locale);
  const setLocale = useLanguageStore((s) => s.setLocale);
  const logout = useAuthStore((s) => s.logout);
  const { mutate: updateMe } = useUpdateMe();

  const isDark = resolvedTheme === "dark";
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [drawer, setDrawer] = useState<string | null>(null);

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      updateMe({ avatar_url: result.assets[0].uri });
    }
  };

  const closeDrawer = useCallback(() => setDrawer(null), []);

  const notifOptions = [
    { label: t("settings.notifications.privateMessage"), toggle: true, toggleValue: true, onPress: () => {} },
    { label: t("settings.notifications.mentioned"), toggle: true, toggleValue: true, onPress: () => {} },
    { label: t("settings.notifications.roomInvitation"), toggle: true, toggleValue: true, onPress: () => {} },
    { label: t("settings.notifications.systemNotification"), toggle: true, toggleValue: true, onPress: () => {} },
    { label: t("settings.notifications.fileUploadComplete"), toggle: true, toggleValue: true, onPress: () => {} },
    { label: t("settings.notifications.sound"), toggle: true, toggleValue: soundEnabled, onPress: () => setSoundEnabled((v) => !v) },
    { label: t("settings.notifications.doNotDisturb"), toggle: true, toggleValue: false, onPress: () => {} },
  ];

  const privacyOptions = [
    { label: t("settings.privacy.onlineStatus"), value: t("common.everyone") ?? "Everyone", onPress: () => {} },
    { label: t("settings.privacy.profileVisibility"), value: t("common.everyone") ?? "Everyone", onPress: () => {} },
    { label: t("settings.privacy.allowStrangerMessage"), toggle: true, toggleValue: false, onPress: () => {} },
    { label: t("settings.privacy.singleDeviceLogin"), toggle: true, toggleValue: true, onPress: () => {} },
    { label: t("settings.privacy.allowRoomInvitation"), toggle: true, toggleValue: true, onPress: () => {} },
  ];

  const appearanceOptions = [
    { label: t("settings.appearance.theme.title"), value: isDark ? t("settings.appearance.theme.dark") : t("settings.appearance.theme.light"), onPress: () => setMode(isDark ? "light" : "dark") },
    { label: t("settings.appearance.fontSize"), onPress: () => {} },
    { label: t("settings.appearance.highContrast"), toggle: true, toggleValue: false, onPress: () => {} },
    { label: t("settings.appearance.reduceAnimations"), toggle: true, toggleValue: false, onPress: () => {} },
  ];

  const languageOptions = supportedLocales.map((loc) => ({
    label: localeLabels[loc],
    value: loc === locale ? "✓" : undefined,
    onPress: () => setLocale(loc),
  }));

  const securityOptions = [
    { label: t("common.changePassword") ?? "Change Password", onPress: () => {} },
    { label: t("common.twoFactor") ?? "Two-Factor Auth", onPress: () => {} },
    { label: t("common.loginHistory") ?? "Login History", onPress: () => {} },
  ];

  const storageOptions = [
    { label: t("common.autoDownloadImages") ?? "Auto-download Images", toggle: true, toggleValue: true, onPress: () => {} },
    { label: t("common.autoDownloadVideos") ?? "Auto-download Videos", toggle: true, toggleValue: false, onPress: () => {} },
    { label: t("common.clearCache") ?? "Clear Cache", onPress: () => {} },
  ];

  return (
    <View className="flex-1 bg-cream" style={{ paddingTop: insets.top }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View className="relative h-[140px] overflow-hidden" style={{ backgroundColor: "#EFF6FF" }}>
          <View className="absolute inset-0" style={{ backgroundColor: "#FFF7ED", opacity: 0.3 }} />
          <View className="absolute inset-0" style={{ backgroundColor: "#ECFDF5", opacity: 0.2 }} />
          <View
            className="absolute -right-5 -top-5 h-[120px] w-[120px] rounded-full"
            style={{ backgroundColor: "rgba(37,99,235,0.18)" }}
          />
          <View
            className="absolute bottom-2.5 left-7 h-20 w-20 rounded-full"
            style={{ backgroundColor: "rgba(244,162,97,0.2)" }}
          />
          <View
            className="absolute top-[40%] right-[20%] h-[60px] w-[60px] rounded-full"
            style={{ backgroundColor: "rgba(94,196,160,0.15)" }}
          />
        </View>

        {/* Avatar + Name */}
        <View className="-mt-9 flex-row items-end gap-3.5 px-5">
          <Pressable onPress={pickAvatar}>
            <Avatar name={user?.username} />
          </Pressable>
          <View className="mb-1 flex-1">
            <Text className="font-display-bold text-xl text-ink">{user?.username ?? "User"}</Text>
            <Text className="text-[12px] text-ink-3">{user?.email ?? ""}</Text>
          </View>
        </View>

        {/* Bio */}
        <View className="mx-5 mb-4 mt-3 rounded-xl border border-border-soft bg-surface p-3">
          <Text className="text-[12.5px] leading-[1.55] text-ink-2">
            Hey there! I'm using Capella Room.
          </Text>
          <Text className="mt-1 font-hand text-[17px] text-purple">✦ making connections</Text>
        </View>

        {/* Stats */}
        <View className="mx-5 mb-5 flex-row gap-2">
          {[
            { num: "0", label: t("profile.stats.messages") },
            { num: "1", label: t("profile.stats.rooms") },
            { num: "0", label: t("profile.stats.friends") },
            { num: "0", label: t("profile.stats.reactions") },
          ].map((stat) => (
            <View
              key={stat.label}
              className="flex-1 items-center rounded-xl border border-border-soft bg-surface px-1.5 py-3"
            >
              <Text className="font-display-bold text-lg text-ink">{stat.num}</Text>
              <Text className="mt-0.5 text-[9px] text-ink-3">{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Toggles */}
        <SettingsSection title={t("profile.quickToggles")}>
          <SettingsItem
            icon="moon-outline"
            iconBg={colors.purpleLight}
            title={t("profile.settings.darkMode")}
            showToggle
            toggleOn={isDark}
            onToggle={(val) => setMode(val ? "dark" : "light")}
          />
          <SettingsItem
            icon="volume-high-outline"
            iconBg={colors.mintLight}
            title={t("profile.settings.soundEffects") ?? "Sound Effects"}
            showToggle
            toggleOn={soundEnabled}
            onToggle={(val) => setSoundEnabled(val)}
          />
          <SettingsItem
            icon="checkmark-outline"
            iconBg={colors.peachLight}
            title={t("profile.settings.readReceipts") ?? "Read Receipts"}
            showToggle
            toggleOn={readReceipts}
            onToggle={(val) => setReadReceipts(val)}
          />
        </SettingsSection>

        {/* Preferences */}
        <SettingsSection title={t("profile.preferences") ?? "Preferences"}>
          <SettingsItem
            icon="notifications-outline"
            iconBg={colors.peachLight}
            title={t("profile.settings.notifications")}
            subtitle={t("profile.settings.notificationsSubtitle")}
            onPress={() => setDrawer("notifications")}
          />
          <SettingsItem
            icon="lock-closed-outline"
            iconBg={colors.mintLight}
            title={t("profile.settings.privacy")}
            subtitle={t("profile.settings.privacySubtitle")}
            onPress={() => setDrawer("privacy")}
          />
          <SettingsItem
            icon="color-palette-outline"
            iconBg={colors.roseLight}
            title={t("profile.settings.appearance")}
            subtitle={t("profile.settings.appearanceSubtitle")}
            onPress={() => setDrawer("appearance")}
          />
          <SettingsItem
            icon="language-outline"
            iconBg={colors.amberLight}
            title={t("profile.settings.language")}
            subtitle={localeLabels[locale]}
            onPress={() => setDrawer("language")}
          />
        </SettingsSection>

        {/* Security */}
        <View className="mx-5 mb-4 overflow-hidden rounded-2xl border border-border-soft bg-surface p-3.5">
          <View className="mb-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.ink} />
              <Text className="text-[13px] font-sans-semibold text-ink">
                {t("profile.security.title")}
              </Text>
            </View>
            <View className="rounded-md bg-mint-light px-2 py-0.5">
              <Text className="text-[9px] font-sans-semibold text-mint-text">
                {t("profile.security.badgeSafe")}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2.5 border-t border-border-soft pt-2.5">
            <View className="h-7 w-7 items-center justify-center rounded-lg bg-surface-alt">
              <Ionicons name="phone-portrait-outline" size={14} color={colors.ink3} />
            </View>
            <View className="flex-1">
              <Text className="text-[12px] font-sans-medium text-ink">Android Emulator</Text>
              <Text className="text-[10px] text-ink-4">{t("profile.security.current")}</Text>
            </View>
            <View className="h-2 w-2 rounded-full bg-mint" />
          </View>
        </View>

        {/* Account */}
        <SettingsSection title={t("profile.account") ?? "Account"}>
          <SettingsItem
            icon="shield-checkmark-outline"
            iconBg={colors.surfaceAlt ?? "#F1F5F9"}
            title={t("profile.settings.security")}
            subtitle={t("profile.settings.securitySubtitle")}
            onPress={() => setDrawer("security")}
          />
          <SettingsItem
            icon="archive-outline"
            iconBg={colors.surfaceAlt ?? "#F1F5F9"}
            title={t("profile.settings.storage")}
            subtitle={t("profile.settings.storageSubtitle")}
            onPress={() => setDrawer("storage")}
          />
          <SettingsItem
            icon="log-out-outline"
            iconBg={colors.roseLight}
            title={t("profile.logout")}
            onPress={logout}
          />
        </SettingsSection> 

        <View className="h-8" />
      </ScrollView>

      <SettingsDrawer
        visible={drawer === "notifications"}
        title={t("settings.notifications.title")}
        options={notifOptions}
        onClose={closeDrawer}
      />
      <SettingsDrawer
        visible={drawer === "privacy"}
        title={t("settings.privacy.title")}
        options={privacyOptions}
        onClose={closeDrawer}
      />
      <SettingsDrawer
        visible={drawer === "appearance"}
        title={t("settings.appearance.title")}
        options={appearanceOptions}
        onClose={closeDrawer}
      />
      <SettingsDrawer
        visible={drawer === "language"}
        title={t("settings.language.title")}
        options={languageOptions}
        onClose={closeDrawer}
      />
      <SettingsDrawer
        visible={drawer === "security"}
        title={t("profile.settings.security") ?? "Security"}
        options={securityOptions}
        onClose={closeDrawer}
      />
      <SettingsDrawer
        visible={drawer === "storage"}
        title={t("common.storage") ?? "Storage & Data"}
        options={storageOptions}
        onClose={closeDrawer}
      />
    </View>
  );
}
