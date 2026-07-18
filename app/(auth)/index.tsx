import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "../../lib/utils/zodResolver";
import { z } from "zod";
import { useAuthStore } from "../../lib/store/auth";
import { ApiError } from "../../lib/api/client";

/* ─── Zod Schemas ──────────────────────────────────────── */

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be at most 20 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[0-9]/, "Password must contain a number"),
  });

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

/* ─── Design Tokens ────────────────────────────────────── */

const COLORS = {
  cream: "#F7F9FC",
  surface: "#FFFFFF",
  surfaceAlt: "#F1F5F9",
  purple: "#2563EB",
  ink: "#1E293B",
  ink2: "#334155",
  ink3: "#94A3B8",
  ink4: "#CBD5E1",
  border: "#E8EDF3",
  rose: "#E8788A",
  peach: "#F4A261",
  mint: "#5EC4A0",
};

type AuthTab = "login" | "register";

/* ─── Tab Switcher ─────────────────────────────────────── */

function TabSwitcher({
  active,
  onSwitch,
}: {
  active: AuthTab;
  onSwitch: (tab: AuthTab) => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: COLORS.surfaceAlt,
        borderRadius: 14,
        padding: 3,
        marginBottom: 24,
      }}
    >
      {(
        [
          { key: "login" as AuthTab, label: "Sign In" },
          { key: "register" as AuthTab, label: "Create Account" },
        ] as const
      ).map((tab) => (
        <TouchableOpacity
          key={tab.key}
          onPress={() => onSwitch(tab.key)}
          activeOpacity={0.7}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 11,
            alignItems: "center",
            backgroundColor:
              active === tab.key ? COLORS.surface : "transparent",
            ...(active === tab.key
              ? {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06,
                  shadowRadius: 4,
                  elevation: 1,
                }
              : {}),
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: active === tab.key ? COLORS.ink : COLORS.ink3,
            }}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

/* ─── Input Field (controlled by react-hook-form) ─────── */

function InputField({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  return (
    <View>
      <Text
        style={{
          fontSize: 11,
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          color: COLORS.ink3,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? "none"}
        placeholderTextColor={COLORS.ink4}
        style={{
          width: "100%",
          paddingVertical: 13,
          paddingHorizontal: 16,
          borderWidth: 1.5,
          borderColor: error ? COLORS.rose : COLORS.border,
          borderRadius: 14,
          fontSize: 14,
          backgroundColor: COLORS.surface,
          color: COLORS.ink,
        }}
      />
      {error ? (
        <Text
          style={{
            fontSize: 11,
            color: COLORS.rose,
            marginTop: 4,
            marginLeft: 2,
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

/* ─── Password Strength Bar ────────────────────────────── */

function PasswordStrength({ password }: { password: string }) {
  const levels = [
    { ok: password.length >= 4, color: COLORS.rose },
    { ok: password.length >= 6, color: COLORS.peach },
    {
      ok:
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[0-9]/.test(password),
      color: COLORS.mint,
    },
    {
      ok:
        password.length >= 10 &&
        /[A-Z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^A-Za-z0-9]/.test(password),
      color: COLORS.mint,
    },
  ];

  return (
    <View style={{ flexDirection: "row", gap: 4, marginTop: 6 }}>
      {levels.map((level, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 3,
            borderRadius: 2,
            backgroundColor: level.ok ? level.color : COLORS.border,
          }}
        />
      ))}
    </View>
  );
}

/* ─── Auth Screen ──────────────────────────────────────── */

export default function AuthScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [activeTab, setActiveTab] = useState<AuthTab>("login");

  /* ── Login form ── */
  const {
    control: loginControl,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  /* ── Register form ── */
  const {
    control: regControl,
    handleSubmit: handleRegSubmit,
    formState: { errors: regErrors },
    watch: regWatch,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", username: "", password: "" },
  });

  const regPassword = regWatch("password");

  /* ── Handlers ── */
  const onLogin = useCallback(
    async (data: LoginForm) => {
      try {
        await login(data.email, data.password);
      } catch (e) {
        Alert.alert(
          "Login Failed",
          e instanceof ApiError ? e.message : "Network error. Please try again.",
        );
      }
    },
    [login],
  );

  const onRegister = useCallback(
    async (data: RegisterForm) => {
      try {
        await register(data.username, data.email, data.password);
        Alert.alert("Account Created", "You can now sign in.", [
          { text: "OK", onPress: () => setActiveTab("login") },
        ]);
      } catch (e) {
        Alert.alert(
          "Registration Failed",
          e instanceof ApiError ? e.message : "Network error. Please try again.",
        );
      }
    },
    [register],
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: COLORS.cream }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Gradient Background ── */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "55%",
          }}
        >
          <LinearGradient
            colors={["#EFF6FF", "#FFF7ED", "#ECFDF5"]}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          >
            <View
              style={{
                position: "absolute",
                width: 200,
                height: 200,
                borderRadius: 100,
                top: -30,
                right: -40,
                backgroundColor: "rgba(123,106,232,0.15)",
              }}
            />
            <View
              style={{
                position: "absolute",
                width: 160,
                height: 160,
                borderRadius: 80,
                bottom: 40,
                left: -30,
                backgroundColor: "rgba(244,162,97,0.12)",
              }}
            />
            <View
              style={{
                position: "absolute",
                width: 100,
                height: 100,
                borderRadius: 50,
                top: "40%",
                right: "20%",
                backgroundColor: "rgba(94,196,160,0.12)",
              }}
            />
          </LinearGradient>
        </View>

        {/* ── Content ── */}
        <View
          style={{
            paddingTop: Platform.OS === "ios" ? 74 : 60,
            paddingHorizontal: 28,
            paddingBottom: 40,
            zIndex: 10,
          }}
        >
          {/* ── Logo ── */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              marginBottom: 32,
            }}
          >
            <Image
              source={require("../../assets/icon.png")}
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                transform: [{ rotate: "-5deg" }],
              }}
              resizeMode="cover"
            />
            <Text
              style={{
                fontFamily: "Space Grotesk",
                fontSize: 22,
                fontWeight: "700",
                letterSpacing: -0.5,
                color: COLORS.ink,
              }}
            >
              Capella
            </Text>
          </View>

          {/* ── Hero ── */}
          <View style={{ marginBottom: 36 }}>
            <Text
              style={{
                fontFamily: "Space Grotesk",
                fontSize: 30,
                fontWeight: "700",
                lineHeight: 34,
                letterSpacing: -0.5,
                color: COLORS.ink,
                marginBottom: 10,
              }}
            >
              Where chats{"\n"}feel like{" "}
              <Text style={{ color: COLORS.purple }}>home</Text>
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: COLORS.ink3,
                lineHeight: 22,
              }}
            >
              Real-time messaging for communities, teams & friends. Fast,
              beautiful, and private.
            </Text>
          </View>

          {/* ── Tab Switcher ── */}
          <TabSwitcher active={activeTab} onSwitch={setActiveTab} />

          {/* ── Login Form ── */}
          {activeTab === "login" && (
            <View style={{ gap: 16 }}>
              <Controller
                control={loginControl}
                name="email"
                render={({ field: { value, onChange } }) => (
                  <InputField
                    label="Email"
                    placeholder="you@example.com"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="email-address"
                    error={loginErrors.email?.message}
                  />
                )}
              />
              <Controller
                control={loginControl}
                name="password"
                render={({ field: { value, onChange } }) => (
                  <InputField
                    label="Password"
                    placeholder="••••••••"
                    value={value}
                    onChangeText={onChange}
                    secureTextEntry
                    error={loginErrors.password?.message}
                  />
                )}
              />

              <TouchableOpacity
                onPress={handleLoginSubmit(onLogin)}
                disabled={isLoading}
                activeOpacity={0.8}
                style={{
                  width: "100%",
                  paddingVertical: 15,
                  borderRadius: 16,
                  backgroundColor: COLORS.purple,
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 4,
                  shadowColor: COLORS.purple,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 16,
                  elevation: 6,
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={{ color: "white", fontSize: 15, fontWeight: "600" }}>
                    Sign In →
                  </Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  marginVertical: 4,
                }}
              >
                <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
                <Text style={{ fontSize: 11, color: COLORS.ink4 }}>
                  or continue with
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
              </View>

              {/* Social buttons */}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderWidth: 1.5,
                    borderColor: COLORS.border,
                    borderRadius: 14,
                    backgroundColor: COLORS.surface,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Ionicons name="logo-google" size={16} color="#4285F4" />
                  <Text style={{ fontSize: 13, fontWeight: "500", color: COLORS.ink2 }}>
                    Google
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderWidth: 1.5,
                    borderColor: COLORS.border,
                    borderRadius: 14,
                    backgroundColor: COLORS.surface,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Ionicons name="logo-github" size={16} color="#333" />
                  <Text style={{ fontSize: 13, fontWeight: "500", color: COLORS.ink2 }}>
                    GitHub
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── Register Form ── */}
          {activeTab === "register" && (
            <View style={{ gap: 16 }}>
              <Controller
                control={regControl}
                name="email"
                render={({ field: { value, onChange } }) => (
                  <InputField
                    label="Email"
                    placeholder="you@example.com"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="email-address"
                    error={regErrors.email?.message}
                  />
                )}
              />
              <Controller
                control={regControl}
                name="username"
                render={({ field: { value, onChange } }) => (
                  <InputField
                    label="Username"
                    placeholder="cool_user"
                    value={value}
                    onChangeText={onChange}
                    autoCapitalize="none"
                    error={regErrors.username?.message}
                  />
                )}
              />
              <Controller
                control={regControl}
                name="password"
                render={({ field: { value, onChange } }) => (
                  <InputField
                    label="Password"
                    placeholder="Min 8 characters"
                    value={value}
                    onChangeText={onChange}
                    secureTextEntry
                    error={regErrors.password?.message}
                  />
                )}
              />
              <PasswordStrength password={regPassword ?? ""} />

              <TouchableOpacity
                onPress={handleRegSubmit(onRegister)}
                disabled={isLoading}
                activeOpacity={0.8}
                style={{
                  width: "100%",
                  paddingVertical: 15,
                  borderRadius: 16,
                  backgroundColor: COLORS.purple,
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 4,
                  shadowColor: COLORS.purple,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 16,
                  elevation: 6,
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={{ color: "white", fontSize: 15, fontWeight: "600" }}>
                    Create Account ✦
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
