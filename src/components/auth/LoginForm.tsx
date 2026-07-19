/**
 * Login form with password / code toggle.
 */

import { useState, useCallback } from "react";
import { View, Alert, Pressable, Text } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { zodResolver } from "@/lib/utils/zodResolver";
import { ApiError } from "@/lib/api/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";
import { SocialButton } from "@/components/ui/SocialButton";
import { useThemeColors } from "@/lib/hooks/useThemeColors";

const passwordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const codeSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  code: z.string().min(4, "Please enter the verification code"),
});

type PasswordFormData = z.infer<typeof passwordSchema>;
type CodeFormData = z.infer<typeof codeSchema>;

interface LoginFormProps {
  onPasswordSubmit: (data: PasswordFormData) => Promise<void>;
  onCodeSubmit: (data: CodeFormData) => Promise<void>;
  onSendCode: (email: string) => Promise<{ message: string; code_length: number }>;
  isLoading: boolean;
}

type LoginMode = "password" | "code";

/**
 * Render the login form.
 *
 * @param props - Login form props.
 * @returns A React element.
 */
export function LoginForm({
  onPasswordSubmit,
  onCodeSubmit,
  onSendCode,
  isLoading,
}: LoginFormProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [mode, setMode] = useState<LoginMode>("password");
  const [sendingCode, setSendingCode] = useState(false);

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { email: "", password: "" },
  });

  const codeForm = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
    defaultValues: { email: "", code: "" },
  });

  const handlePasswordSubmit = useCallback(
    async (data: PasswordFormData) => {
      try {
        await onPasswordSubmit(data);
      } catch (e) {
        Alert.alert(
          t("auth.signIn"),
          e instanceof ApiError ? e.message : t("errors.network"),
        );
      }
    },
    [onPasswordSubmit, t],
  );

  const handleCodeSubmit = useCallback(
    async (data: CodeFormData) => {
      try {
        await onCodeSubmit(data);
      } catch (e) {
        Alert.alert(
          t("auth.signIn"),
          e instanceof ApiError ? e.message : t("errors.network"),
        );
      }
    },
    [onCodeSubmit, t],
  );

  const handleSendCode = useCallback(async () => {
    const email = codeForm.getValues("email");
    if (!email) {
      Alert.alert("Error", "Please enter your email first");
      return;
    }
    setSendingCode(true);
    try {
      await onSendCode(email);
      Alert.alert(t("common.done"), "Verification code sent to your email");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to send code");
    } finally {
      setSendingCode(false);
    }
  }, [onSendCode, codeForm, t]);

  return (
    <View className="gap-4">
      {mode === "password" ? (
        <>
          <Controller
            control={passwordForm.control}
            name="email"
            render={({ field: { value, onChange } }) => (
              <Input
                label={t("auth.email")}
                placeholder={t("auth.emailPlaceholder")}
                value={value}
                onChangeText={(v) => {
                  onChange(v);
                  codeForm.setValue("email", v);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                error={passwordForm.formState.errors.email?.message}
              />
            )}
          />
          <Controller
            control={passwordForm.control}
            name="password"
            render={({ field: { value, onChange } }) => (
              <Input
                label={t("auth.password")}
                placeholder={t("auth.passwordPlaceholder")}
                value={value}
                onChangeText={onChange}
                secureTextEntry
                error={passwordForm.formState.errors.password?.message}
              />
            )}
          />
          <Button
            title={t("auth.signIn")}
            onPress={passwordForm.handleSubmit(handlePasswordSubmit)}
            loading={isLoading}
          />
        </>
      ) : (
        <>
          <Controller
            control={codeForm.control}
            name="email"
            render={({ field: { value, onChange } }) => (
              <Input
                label={t("auth.email")}
                placeholder={t("auth.emailPlaceholder")}
                value={value}
                onChangeText={(v) => {
                  onChange(v);
                  passwordForm.setValue("email", v);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                error={codeForm.formState.errors.email?.message}
              />
            )}
          />
          <Controller
            control={codeForm.control}
            name="code"
            render={({ field: { value, onChange } }) => (
              <Input
                label={t("auth.verificationCode")}
                placeholder={t("auth.verificationCodePlaceholder")}
                value={value}
                onChangeText={onChange}
                keyboardType="number-pad"
                autoCapitalize="none"
                error={codeForm.formState.errors.code?.message}
              />
            )}
          />
          <View className="flex-row gap-2.5">
            <View className="flex-1">
              <Button
                title={t("auth.sendCode")}
                onPress={handleSendCode}
                loading={sendingCode}
                variant="outline"
              />
            </View>
            <View className="flex-1">
              <Button
                title={t("auth.signIn")}
                onPress={codeForm.handleSubmit(handleCodeSubmit)}
                loading={isLoading}
              />
            </View>
          </View>
        </>
      )}

      {/* Toggle between password and code login */}
      <Pressable
        onPress={() => setMode(mode === "password" ? "code" : "password")}
        className="items-center pt-1"
      >
        <Text className="text-[12px] font-sans-semibold" style={{ color: colors.purple }}>
          {mode === "password"
            ? (t("auth.loginWithCode") ?? "Email code login")
            : (t("auth.loginWithPassword") ?? "Password login")}
        </Text>
      </Pressable>

      <Divider label={t("auth.orContinueWith")} />

      <View className="flex-row gap-2.5">
        <SocialButton provider="google" />
        <SocialButton provider="github" />
      </View>
    </View>
  );
}
