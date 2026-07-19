import { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useRouter, type Href } from "expo-router";
import { useAuthStore } from "@/lib/store/auth";
import { useThemeColors } from "@/lib/hooks/useThemeColors";
import { useThemeStore } from "@/lib/store/theme";
import { localeLabels, supportedLocales } from "@/lib/i18n";
import { useLanguageStore } from "@/lib/store/language";
import {
  useUpdateMe,
  useUserStats,
  useChangePassword,
  useDeleteAccount,
} from "@/lib/hooks/useUsersQuery";
import { useSettings, useUpdateSettings } from "@/lib/hooks/useSettingsQuery";
import {
  useDevices,
  useTerminateDevice,
  useBlockDevice,
  useUnblockDevice,
  useTerminateAllOtherDevices,
  useLoginHistory,
} from "@/lib/hooks/useSecurityQuery";
import { useFriends } from "@/lib/hooks/useFriendsQuery";
import { useSaveUIConfig, useResetUIConfig } from "@/lib/hooks/useUIConfigQuery";
import * as ImagePicker from "expo-image-picker";
import { uploadAvatar } from "@/lib/api/files";
import { getWsClient } from "@/lib/ws/client";
import { SettingsDrawer } from "@/components/ui/SettingsDrawer";

function Avatar({
  name,
  url,
  size = 72,
  loading,
}: {
  name?: string;
  url?: string | null;
  size?: number;
  loading?: boolean;
}) {
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
      {url ? (
        <Image source={{ uri: url }} className="h-full w-full" resizeMode="cover" />
      ) : (
        <Text className="font-sans-bold text-white" style={{ fontSize: size * 0.36 }}>
          {initial}
        </Text>
      )}
      {loading && (
        <View className="absolute inset-0 items-center justify-center bg-black/30">
          <ActivityIndicator size="small" color="white" />
        </View>
      )}
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

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
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
  const router = useRouter();
  const storeLogout = useAuthStore((s) => s.logout);
  const { mutate: updateMe } = useUpdateMe();
  const { data: userStats } = useUserStats();
  const { data: friendsData } = useFriends();
  const friendsCount = friendsData?.length ?? 0;
  const { data: userSettings } = useSettings();
  const { mutate: updateSettings } = useUpdateSettings();
  const { mutate: changePassword, isPending: changingPassword } = useChangePassword();
  const { mutate: deleteAccount } = useDeleteAccount();
  const { data: devices } = useDevices();
  const { data: loginHistoryData } = useLoginHistory(20);
  const { mutate: terminateDevice } = useTerminateDevice();
  const { mutate: blockDevice } = useBlockDevice();
  const { mutate: unblockDevice } = useUnblockDevice();
  const { mutate: terminateOthers } = useTerminateAllOtherDevices();
  const { mutate: saveUIConfig } = useSaveUIConfig();

  const isDark = resolvedTheme === "dark";
  const [drawer, setDrawer] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Password change modal
  const [pwModalVisible, setPwModalVisible] = useState(false);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");

  // Login history modal
  const [loginHistoryVisible, setLoginHistoryVisible] = useState(false);

  // Local toggle state synced from server settings
  const settingsInitialized = useRef(false);
  const [localNotif, setLocalNotif] = useState<Record<string, boolean>>({});
  const [localPrivacy, setLocalPrivacy] = useState<Record<string, boolean | string>>({});
  const [localAccessibility, setLocalAccessibility] = useState<
    Record<string, boolean | string>
  >({});
  const [localMedia, setLocalMedia] = useState<Record<string, boolean | string>>({});

  useEffect(() => {
    if (userSettings && !settingsInitialized.current) {
      settingsInitialized.current = true;
      setLocalNotif({
        privateMessage: userSettings.notification.private_message,
        mentioned: userSettings.notification.mentioned,
        roomInvitation: userSettings.notification.room_invitation,
        systemNotification: userSettings.notification.system_notification,
        fileUpload: userSettings.notification.file_upload_complete,
        sound: userSettings.notification.sound_enabled,
        desktop: userSettings.notification.desktop_notification,
        dnd: userSettings.notification.do_not_disturb,
      });
      setLocalPrivacy({
        allowStrangerMessage: userSettings.privacy.allow_stranger_message,
        singleDeviceLogin: userSettings.privacy.single_device_login,
        allowRoomInvitation: userSettings.privacy.allow_room_invitation,
        onlineStatus: userSettings.privacy.online_status_visibility,
        profileVisibility: userSettings.privacy.profile_visibility,
      });
      setLocalAccessibility({
        fontSize: userSettings.accessibility.font_size,
        highContrast: userSettings.accessibility.high_contrast,
        reduceMotion: userSettings.accessibility.reduce_motion,
        denseMode: userSettings.accessibility.dense_mode,
      });
      setLocalMedia({
        autoDownloadMedia: userSettings.media.auto_download_media,
        saveMediaGallery: userSettings.media.save_media_gallery,
        imageQuality: userSettings.media.image_quality,
        autoPlayVideo: userSettings.media.auto_play_video,
        autoPlayAudio: userSettings.media.auto_play_audio,
      });
    }
  }, [userSettings]);

  const toggleNotif = useCallback(
    (key: string, value: boolean) => {
      setLocalNotif((prev) => ({ ...prev, [key]: value }));
      const payload: Record<string, any> = {};
      const map: Record<string, string> = {
        privateMessage: "private_message",
        mentioned: "mentioned",
        roomInvitation: "room_invitation",
        systemNotification: "system_notification",
        fileUpload: "file_upload_complete",
        sound: "sound_enabled",
        desktop: "desktop_notification",
        dnd: "do_not_disturb",
      };
      if (map[key]) {
        payload[map[key]] = value;
      }
      updateSettings({
        notification: userSettings?.notification
          ? { ...userSettings.notification, ...payload }
          : undefined,
      } as any);
    },
    [updateSettings, userSettings],
  );

  const togglePrivacy = useCallback(
    (key: string, value: boolean) => {
      setLocalPrivacy((prev) => ({ ...prev, [key]: value }));
      const map: Record<string, string> = {
        allowStrangerMessage: "allow_stranger_message",
        singleDeviceLogin: "single_device_login",
        allowRoomInvitation: "allow_room_invitation",
      };
      const field = map[key];
      if (field && userSettings) {
        updateSettings({
          privacy: { ...userSettings.privacy, [field]: value },
        } as any);
      }
    },
    [updateSettings, userSettings],
  );

  const toggleAccessibility = useCallback(
    (key: string, value: boolean | string) => {
      setLocalAccessibility((prev) => ({ ...prev, [key]: value }));
      if (!userSettings) return;
      const map: Record<string, string> = {
        highContrast: "high_contrast",
        reduceMotion: "reduce_motion",
        denseMode: "dense_mode",
      };
      if (key === "fontSize") {
        updateSettings({
          accessibility: { ...userSettings.accessibility, font_size: value as any },
        } as any);
      } else if (map[key]) {
        updateSettings({
          accessibility: { ...userSettings.accessibility, [map[key]]: value },
        } as any);
      }
    },
    [updateSettings, userSettings],
  );

  const toggleMedia = useCallback(
    (key: string, value: boolean | string) => {
      setLocalMedia((prev) => ({ ...prev, [key]: value }));
      if (!userSettings) return;
      const map: Record<string, string> = {
        autoDownloadMedia: "auto_download_media",
        saveMediaGallery: "save_media_gallery",
        imageQuality: "image_quality",
        autoPlayVideo: "auto_play_video",
        autoPlayAudio: "auto_play_audio",
      };
      const field = map[key];
      if (field) {
        updateSettings({ media: { ...userSettings.media, [field]: value } } as any);
      }
    },
    [updateSettings, userSettings],
  );

  const handleChangePassword = useCallback(() => {
    if (!oldPw || !newPw) {
      Alert.alert("Error", "Please fill in both fields");
      return;
    }
    if (newPw.length < 8) {
      Alert.alert("Error", "New password must be at least 8 characters");
      return;
    }
    changePassword(
      { oldPassword: oldPw, newPassword: newPw },
      {
        onSuccess: () => {
          Alert.alert("Success", "Password changed successfully");
          setPwModalVisible(false);
          setOldPw("");
          setNewPw("");
        },
        onError: (err: any) => {
          Alert.alert("Error", err?.message ?? "Failed to change password");
        },
      },
    );
  }, [oldPw, newPw, changePassword]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all your data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteAccount(undefined, {
              onSuccess: () => {
                useAuthStore.getState().logout();
                router.replace("/(auth)" as Href);
              },
              onError: (err: any) => {
                Alert.alert("Error", err?.message ?? "Failed to delete account");
              },
            });
          },
        },
      ],
    );
  }, [deleteAccount, router]);

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
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: asset.uri,
        name: asset.fileName ?? "avatar.jpg",
        type: asset.mimeType ?? "image/jpeg",
      } as any);
      const fileInfo = await uploadAvatar(formData);
      updateMe({ avatar_url: fileInfo.file_url });
    } catch (err: any) {
      Alert.alert("Upload failed", err?.message ?? "Could not upload avatar");
    } finally {
      setAvatarUploading(false);
    }
  };

  const closeDrawer = useCallback(() => setDrawer(null), []);

  const notifOptions = [
    {
      label: t("settings.notifications.privateMessage"),
      toggle: true,
      toggleValue: localNotif.privateMessage ?? true,
      onPress: () => toggleNotif("privateMessage", !localNotif.privateMessage),
    },
    {
      label: t("settings.notifications.mentioned"),
      toggle: true,
      toggleValue: localNotif.mentioned ?? true,
      onPress: () => toggleNotif("mentioned", !localNotif.mentioned),
    },
    {
      label: t("settings.notifications.roomInvitation"),
      toggle: true,
      toggleValue: localNotif.roomInvitation ?? true,
      onPress: () => toggleNotif("roomInvitation", !localNotif.roomInvitation),
    },
    {
      label: t("settings.notifications.systemNotification"),
      toggle: true,
      toggleValue: localNotif.systemNotification ?? true,
      onPress: () => toggleNotif("systemNotification", !localNotif.systemNotification),
    },
    {
      label: t("settings.notifications.fileUploadComplete"),
      toggle: true,
      toggleValue: localNotif.fileUpload ?? true,
      onPress: () => toggleNotif("fileUpload", !localNotif.fileUpload),
    },
    {
      label: t("settings.notifications.sound"),
      toggle: true,
      toggleValue: localNotif.sound ?? true,
      onPress: () => toggleNotif("sound", !localNotif.sound),
    },
    {
      label: t("settings.notifications.desktop"),
      toggle: true,
      toggleValue: localNotif.desktop ?? true,
      onPress: () => toggleNotif("desktop", !localNotif.desktop),
    },
    {
      label: t("settings.notifications.doNotDisturb"),
      toggle: true,
      toggleValue: localNotif.dnd ?? false,
      onPress: () => toggleNotif("dnd", !localNotif.dnd),
    },
  ];

  const privacyOptions = [
    {
      label: t("settings.privacy.onlineStatus"),
      value: String(localPrivacy.onlineStatus ?? "everyone"),
      onPress: () => {},
    },
    {
      label: t("settings.privacy.profileVisibility"),
      value: String(localPrivacy.profileVisibility ?? "everyone"),
      onPress: () => {},
    },
    {
      label: t("settings.privacy.allowStrangerMessage"),
      toggle: true,
      toggleValue: !!localPrivacy.allowStrangerMessage,
      onPress: () =>
        togglePrivacy("allowStrangerMessage", !localPrivacy.allowStrangerMessage),
    },
    {
      label: t("settings.privacy.singleDeviceLogin"),
      toggle: true,
      toggleValue: !!localPrivacy.singleDeviceLogin,
      onPress: () => togglePrivacy("singleDeviceLogin", !localPrivacy.singleDeviceLogin),
    },
    {
      label: t("settings.privacy.allowRoomInvitation"),
      toggle: true,
      toggleValue: !!localPrivacy.allowRoomInvitation,
      onPress: () =>
        togglePrivacy("allowRoomInvitation", !localPrivacy.allowRoomInvitation),
    },
  ];

  const appearanceOptions = [
    {
      label: t("settings.appearance.theme.title"),
      value: isDark
        ? t("settings.appearance.theme.dark")
        : t("settings.appearance.theme.light"),
      onPress: () => {
        const mode = isDark ? "light" : "dark";
        setMode(mode);
        saveUIConfig({ theme: { name: mode } });
      },
    },
    {
      label: t("settings.appearance.fontSize"),
      value: String(localAccessibility.fontSize ?? "medium"),
      onPress: () => {
        const cycle: Record<string, string> = {
          small: "medium",
          medium: "large",
          large: "small",
        };
        const next = cycle[String(localAccessibility.fontSize ?? "medium")] || "medium";
        toggleAccessibility("fontSize", next);
      },
    },
    {
      label: t("settings.appearance.highContrast"),
      toggle: true,
      toggleValue: !!localAccessibility.highContrast,
      onPress: () =>
        toggleAccessibility("highContrast", !localAccessibility.highContrast),
    },
    {
      label: t("settings.appearance.reduceAnimations"),
      toggle: true,
      toggleValue: !!localAccessibility.reduceMotion,
      onPress: () =>
        toggleAccessibility("reduceMotion", !localAccessibility.reduceMotion),
    },
  ];

  const languageOptions = supportedLocales.map((loc) => ({
    label: localeLabels[loc],
    value: loc === locale ? "✓" : undefined,
    onPress: () => setLocale(loc),
  }));

  const securityOptions = [
    {
      label: t("common.changePassword") ?? "Change Password",
      onPress: () => setPwModalVisible(true),
    },
    {
      label: t("common.loginHistory") ?? "Login History",
      onPress: () => setLoginHistoryVisible(true),
    },
    ...(devices && devices.length > 1
      ? [
          {
            label: t("profile.security.terminateOthers") ?? "Terminate other devices",
            onPress: () => {
              Alert.alert("Terminate Others", "Log out all other devices?", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Terminate",
                  style: "destructive",
                  onPress: () => terminateOthers(),
                },
              ]);
            },
          },
        ]
      : []),
  ];

  const { mutate: resetUIConfig } = useResetUIConfig();
  const storageOptions = [
    {
      label: "Auto-download Media",
      toggle: true,
      toggleValue: !!localMedia.autoDownloadMedia,
      onPress: () => toggleMedia("autoDownloadMedia", !localMedia.autoDownloadMedia),
    },
    {
      label: "Save to Gallery",
      toggle: true,
      toggleValue: !!localMedia.saveMediaGallery,
      onPress: () => toggleMedia("saveMediaGallery", !localMedia.saveMediaGallery),
    },
    {
      label: "Auto-play Video",
      toggle: true,
      toggleValue: !!localMedia.autoPlayVideo,
      onPress: () => toggleMedia("autoPlayVideo", !localMedia.autoPlayVideo),
    },
    {
      label: "Auto-play Audio",
      toggle: true,
      toggleValue: !!localMedia.autoPlayAudio,
      onPress: () => toggleMedia("autoPlayAudio", !localMedia.autoPlayAudio),
    },
    {
      label: "Image Quality",
      value: String(localMedia.imageQuality ?? "high"),
      onPress: () => {
        const cycle: Record<string, string> = {
          original: "high",
          high: "medium",
          medium: "low",
          low: "original",
        };
        const next = cycle[String(localMedia.imageQuality ?? "high")] || "high";
        toggleMedia("imageQuality", next);
      },
    },
    {
      label: "Reset Cloud UI Config",
      onPress: () => {
        Alert.alert(
          "Reset UI Config",
          "Reset your cloud-synced UI settings to default?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Reset", style: "destructive", onPress: () => resetUIConfig() },
          ],
        );
      },
    },
    { label: t("common.clearCache") ?? "Clear Cache", onPress: () => {} },
  ];

  return (
    <View className="flex-1 bg-cream" style={{ paddingTop: insets.top }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View
          className="relative h-[140px] overflow-hidden"
          style={{ backgroundColor: "#EFF6FF" }}
        >
          <View
            className="absolute inset-0"
            style={{ backgroundColor: "#FFF7ED", opacity: 0.3 }}
          />
          <View
            className="absolute inset-0"
            style={{ backgroundColor: "#ECFDF5", opacity: 0.2 }}
          />
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
          <Pressable onPress={pickAvatar} disabled={avatarUploading}>
            <Avatar
              name={user?.username}
              url={user?.avatar_url}
              loading={avatarUploading}
            />
          </Pressable>
          <View className="mb-1 flex-1">
            <Text className="font-display-bold text-xl text-ink">
              {user?.username ?? "User"}
            </Text>
            <Text className="text-[12px] text-ink-3">{user?.email ?? ""}</Text>
          </View>
        </View>

        {/* Bio */}
        <View className="mx-5 mb-4 mt-3 rounded-xl border border-border-soft bg-surface p-3">
          <Text className="text-[12.5px] leading-[1.55] text-ink-2">
            Hey there! I&apos;m using Capella Room.
          </Text>
          <Text className="mt-1 font-hand text-[17px] text-purple">
            ✦ making connections
          </Text>
        </View>

        {/* Stats */}
        <View className="mx-5 mb-5 flex-row gap-2">
          {[
            {
              num: String(userStats?.total_messages ?? 0),
              label: t("profile.stats.messages"),
            },
            {
              num: String(userStats?.joined_rooms ?? 0),
              label: t("profile.stats.rooms"),
            },
            { num: String(friendsCount), label: t("profile.stats.friends") },
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

        {/* Online Status */}
        <SettingsSection title={t("profile.status.title")}>
          <SettingsItem
            icon="radio-button-on-outline"
            iconBg={colors.mintLight}
            title={t("profile.status.current")}
            subtitle={t(`profile.status.${user?.status ?? "offline"}`)}
            onPress={() => {
              const options: { key: "online" | "away" | "offline"; label: string }[] = [
                { key: "online", label: t("profile.status.online") },
                { key: "away", label: t("profile.status.away") },
                { key: "offline", label: t("profile.status.offline") },
              ];
              Alert.alert(t("profile.status.changeTitle"), undefined, [
                ...options.map((opt) => ({
                  text: opt.label,
                  onPress: () => {
                    getWsClient().send("UpdateStatus", { status: opt.key });
                    useAuthStore.getState().setUserStatus(opt.key);
                  },
                })),
                { text: t("common.cancel"), style: "cancel" as const },
              ]);
            }}
          />
        </SettingsSection>

        {/* Quick Toggles */}
        <SettingsSection title={t("profile.quickToggles")}>
          <SettingsItem
            icon="moon-outline"
            iconBg={colors.purpleLight}
            title={t("profile.settings.darkMode")}
            showToggle
            toggleOn={isDark}
            onToggle={(val) => {
              const mode = val ? "dark" : "light";
              setMode(mode);
              saveUIConfig({ theme: { name: mode } });
            }}
          />
          <SettingsItem
            icon="volume-high-outline"
            iconBg={colors.mintLight}
            title={t("profile.settings.soundEffects") ?? "Sound Effects"}
            showToggle
            toggleOn={localNotif.sound ?? true}
            onToggle={(val) => toggleNotif("sound", val)}
          />
          <SettingsItem
            icon="checkmark-outline"
            iconBg={colors.peachLight}
            title={t("profile.settings.readReceipts") ?? "Read Receipts"}
            showToggle
            toggleOn={userSettings?.message?.read_receipt ?? true}
            onToggle={(val) => {
              if (userSettings) {
                updateSettings({
                  message: { ...userSettings.message, read_receipt: val },
                } as any);
              }
            }}
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

        {/* Active Devices */}
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
                {devices && devices.length > 0
                  ? `${devices.length} active`
                  : t("profile.security.badgeSafe")}
              </Text>
            </View>
          </View>
          {(devices ?? []).slice(0, 3).map((device: any) => (
            <Pressable
              key={device.id}
              onPress={() => {
                const actions: {
                  text: string;
                  style?: "default" | "cancel" | "destructive";
                  onPress?: () => void;
                }[] = [
                  {
                    text: device.is_blocked
                      ? t("profile.security.unblock")
                      : t("profile.security.block"),
                    onPress: () =>
                      device.is_blocked
                        ? unblockDevice(device.id)
                        : blockDevice(device.id),
                  },
                  {
                    text: t("profile.security.terminate"),
                    style: "destructive",
                    onPress: () => terminateDevice(device.id),
                  },
                  { text: t("common.cancel"), style: "cancel" },
                ];
                Alert.alert(
                  device.device_name ?? t("common.unknown"),
                  t("profile.security.deviceActions"),
                  actions,
                );
              }}
              className="flex-row items-center gap-2.5 border-t border-border-soft pt-2.5 mt-2.5 first:mt-0 active:opacity-70"
            >
              <View className="h-7 w-7 items-center justify-center rounded-lg bg-surface-alt">
                <Ionicons
                  name={
                    device.device_type === "mobile"
                      ? "phone-portrait-outline"
                      : "laptop-outline"
                  }
                  size={14}
                  color={colors.ink3}
                />
              </View>
              <View className="flex-1">
                <Text className="text-[12px] font-sans-medium text-ink">
                  {device.device_name ?? "Unknown"}
                </Text>
                <Text className="text-[10px] text-ink-4">
                  {device.is_current
                    ? t("profile.security.current")
                    : (device.location ?? "")}
                  {device.is_blocked ? ` · ${t("profile.security.blocked")}` : ""}
                </Text>
              </View>
              <View
                className={`h-2 w-2 rounded-full ${device.is_blocked ? "bg-rose" : device.is_current ? "bg-mint" : "bg-ink-4/40"}`}
              />
            </Pressable>
          ))}
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
            icon="trash-outline"
            iconBg={colors.roseLight}
            title="Delete Account"
            subtitle="Permanently delete your account"
            onPress={handleDeleteAccount}
          />
          <SettingsItem
            icon="log-out-outline"
            iconBg={colors.roseLight}
            title={t("profile.logout")}
            onPress={async () => {
              await storeLogout();
              router.replace("/(auth)" as Href);
            }}
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

      {/* Password Change Modal */}
      <Modal
        visible={pwModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPwModalVisible(false)}
      >
        <Pressable
          className="flex-1 justify-center bg-black/40 px-6"
          onPress={() => setPwModalVisible(false)}
        >
          <Pressable onPress={() => {}} className="rounded-2xl bg-surface p-6">
            <Text className="mb-4 text-center text-[17px] font-display-bold text-ink">
              {t("common.changePassword")}
            </Text>
            <TextInput
              value={oldPw}
              onChangeText={setOldPw}
              placeholder="Current password"
              placeholderTextColor={colors.ink4}
              secureTextEntry
              className="mb-3 rounded-xl border border-border-soft px-4 py-3 text-[14px] text-ink"
            />
            <TextInput
              value={newPw}
              onChangeText={setNewPw}
              placeholder="New password (min 8 chars)"
              placeholderTextColor={colors.ink4}
              secureTextEntry
              className="mb-4 rounded-xl border border-border-soft px-4 py-3 text-[14px] text-ink"
            />
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setPwModalVisible(false)}
                className="flex-1 rounded-xl border border-border-soft py-3"
              >
                <Text className="text-center text-[13px] font-sans-semibold text-ink-3">
                  {t("common.cancel")}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleChangePassword}
                disabled={changingPassword || !oldPw || !newPw}
                className="flex-1 rounded-xl bg-purple py-3"
              >
                {changingPassword ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-center text-[13px] font-sans-semibold text-white">
                    {t("common.save")}
                  </Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Login History Modal */}
      <Modal
        visible={loginHistoryVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLoginHistoryVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <Pressable onPress={() => setLoginHistoryVisible(false)} className="flex-1" />
          <View className="max-h-[60%] rounded-t-3xl bg-cream pb-6">
            <Pressable
              onPress={() => setLoginHistoryVisible(false)}
              className="items-center pt-3 pb-2"
            >
              <View className="h-1 w-10 rounded-full bg-ink-4/40" />
            </Pressable>
            <Text className="mb-3 text-center text-[17px] font-display-bold text-ink">
              {t("common.loginHistory")}
            </Text>
            <ScrollView className="px-5">
              {((loginHistoryData as any)?.data ?? []).length === 0 ? (
                <Text className="py-8 text-center text-[13px] text-ink-3">
                  {t("profile.security.noLoginHistory")}
                </Text>
              ) : (
                ((loginHistoryData as any)?.data ?? []).map((entry: any) => {
                  const matchingDevice = (devices ?? []).find(
                    (d: any) =>
                      d.device_name === entry.device_name &&
                      d.device_type === entry.device_type,
                  );
                  return (
                    <Pressable
                      key={entry.id}
                      onPress={() => {
                        const actions: {
                          text: string;
                          style?: "default" | "cancel" | "destructive";
                          onPress?: () => void;
                        }[] = [];
                        if (matchingDevice) {
                          actions.push({
                            text: matchingDevice.is_blocked
                              ? t("profile.security.unblock")
                              : t("profile.security.block"),
                            onPress: () =>
                              matchingDevice.is_blocked
                                ? unblockDevice(matchingDevice.id)
                                : blockDevice(matchingDevice.id),
                          });
                        }
                        actions.push({ text: t("common.close"), style: "cancel" });
                        Alert.alert(
                          entry.is_suspicious
                            ? t("profile.security.suspiciousLogin")
                            : t("profile.security.loginDetail"),
                          `${entry.device_name ?? t("common.unknown")}\n${entry.ip_address}${entry.location ? ` · ${entry.location}` : ""}\n${new Date(entry.created_at).toLocaleString()}`,
                          actions,
                        );
                      }}
                      className="flex-row items-center gap-3 border-b border-border-soft py-3.5 active:opacity-70"
                    >
                      <View
                        className="h-8 w-8 items-center justify-center rounded-xl"
                        style={{
                          backgroundColor: entry.is_suspicious
                            ? colors.roseLight
                            : entry.login_status === "success"
                              ? colors.mintLight
                              : colors.peachLight,
                        }}
                      >
                        <Ionicons
                          name={
                            entry.is_suspicious
                              ? "warning-outline"
                              : entry.login_status === "success"
                                ? "checkmark"
                                : "close"
                          }
                          size={14}
                          style={{
                            color: entry.is_suspicious
                              ? colors.roseText
                              : entry.login_status === "success"
                                ? colors.mintText
                                : colors.peachText,
                          }}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[12px] font-sans-semibold text-ink">
                          {entry.device_name ?? t("common.unknown")}
                        </Text>
                        <Text className="text-[10px] text-ink-4">
                          {entry.ip_address}
                          {entry.location ? ` · ${entry.location}` : ""}
                        </Text>
                        <Text className="text-[10px] text-ink-4">
                          {new Date(entry.created_at).toLocaleString()}
                        </Text>
                      </View>
                      {entry.is_suspicious && (
                        <View className="rounded-md bg-rose-light px-2 py-0.5">
                          <Text className="text-[9px] font-sans-semibold text-rose-text">
                            {t("profile.security.suspicious")}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
