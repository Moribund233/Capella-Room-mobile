/**
 * Registration form with email verification code flow (v2).
 */

import { useState, useCallback } from "react";
import { View, Alert } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { zodResolver } from "@/lib/utils/zodResolver";
import { ApiError } from "@/lib/api/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  code: z.string().min(4, "Please enter the verification code"),
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
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => Promise<void>;
  onSendCode: (email: string) => Promise<{ message: string; code_length: number }>;
  isLoading: boolean;
}

export function RegisterForm({ onSubmit, onSendCode, isLoading }: RegisterFormProps) {
  const { t } = useTranslation();
  const [sendingCode, setSendingCode] = useState(false);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", code: "", username: "", password: "" },
  });

  const submit = useCallback(
    async (data: RegisterFormData) => {
      try {
        await onSubmit(data);
      } catch (e) {
        Alert.alert(
          t("auth.createAccount"),
          e instanceof ApiError ? e.message : t("errors.network"),
        );
      }
    },
    [onSubmit, t],
  );

  const handleSendCode = useCallback(async () => {
    const email = getValues("email");
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
  }, [onSendCode, getValues, t]);

  return (
    <View className="gap-4">
      <Controller
        control={control}
        name="email"
        render={({ field: { value, onChange } }) => (
          <Input
            label={t("auth.email")}
            placeholder={t("auth.emailPlaceholder")}
            value={value}
            onChangeText={onChange}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email?.message}
          />
        )}
      />

      <View className="flex-row gap-2.5">
        <View className="flex-1">
          <Controller
            control={control}
            name="code"
            render={({ field: { value, onChange } }) => (
              <Input
                label={t("auth.verificationCode")}
                placeholder={t("auth.verificationCodePlaceholder")}
                value={value}
                onChangeText={onChange}
                keyboardType="number-pad"
                autoCapitalize="none"
                error={errors.code?.message}
              />
            )}
          />
        </View>
        <View className="pt-6">
          <Button title={t("auth.sendCode")} onPress={handleSendCode} loading={sendingCode} variant="outline" />
        </View>
      </View>

      <Controller
        control={control}
        name="username"
        render={({ field: { value, onChange } }) => (
          <Input
            label={t("auth.username")}
            placeholder={t("auth.usernamePlaceholder")}
            value={value}
            onChangeText={onChange}
            autoCapitalize="none"
            error={errors.username?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { value, onChange } }) => (
          <Input
            label={t("auth.password")}
            placeholder={t("auth.passwordHint")}
            value={value}
            onChangeText={onChange}
            secureTextEntry
            error={errors.password?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { value, onChange } }) => (
          <Input
            label={t("auth.confirmPassword")}
            placeholder={t("auth.confirmPasswordHint")}
            value={value}
            onChangeText={onChange}
            secureTextEntry
            error={errors.confirmPassword?.message}
          />
        )}
      />

      <Button
        title={t("auth.createAccount")}
        onPress={handleSubmit(submit)}
        loading={isLoading}
      />
    </View>
  );
}
