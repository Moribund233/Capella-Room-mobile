/**
 * Registration form with username, email, password and strength indicator.
 */

import { useCallback } from "react";
import { View, Alert } from "react-native";
import { useForm, Controller, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { zodResolver } from "@/lib/utils/zodResolver";
import { ApiError } from "@/lib/api/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PasswordStrength } from "@/components/ui/PasswordStrength";

const registerSchema = z.object({
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

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  /** Called with valid form data. Should throw ApiError on failure. */
  onSubmit: (data: RegisterFormData) => Promise<void>;
  /** Whether the auth store is processing a request. */
  isLoading: boolean;
}

/**
 * Render the registration form.
 *
 * @param props - Register form props.
 * @returns A React element.
 */
export function RegisterForm({ onSubmit, isLoading }: RegisterFormProps) {
  const { t } = useTranslation();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", username: "", password: "" },
  });

  const password = useWatch({ control, name: "password" });

  const submit = useCallback(
    async (data: RegisterFormData) => {
      try {
        await onSubmit(data);
        Alert.alert(t("common.done"), t("auth.signIn"));
      } catch (e) {
        Alert.alert(
          t("auth.createAccount"),
          e instanceof ApiError ? e.message : t("errors.network"),
        );
      }
    },
    [onSubmit, t],
  );

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
      <PasswordStrength password={password ?? ""} />

      <Button
        title={t("auth.createAccount")}
        onPress={handleSubmit(submit)}
        loading={isLoading}
      />
    </View>
  );
}
