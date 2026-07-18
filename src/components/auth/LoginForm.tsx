/**
 * Login form with email / password validation and submission.
 */

import { useCallback } from "react";
import { View, Alert } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@/lib/utils/zodResolver";
import { ApiError } from "@/lib/api/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";
import { SocialButton } from "@/components/ui/SocialButton";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  /** Called with valid form data. Should throw ApiError on failure. */
  onSubmit: (data: LoginFormData) => Promise<void>;
  /** Whether the auth store is processing a request. */
  isLoading: boolean;
}

/**
 * Render the login form.
 *
 * @param props - Login form props.
 * @returns A React element.
 */
export function LoginForm({ onSubmit, isLoading }: LoginFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const submit = useCallback(
    async (data: LoginFormData) => {
      try {
        await onSubmit(data);
      } catch (e) {
        Alert.alert(
          "Login Failed",
          e instanceof ApiError ? e.message : "Network error. Please try again.",
        );
      }
    },
    [onSubmit],
  );

  return (
    <View className="gap-4">
      <Controller
        control={control}
        name="email"
        render={({ field: { value, onChange } }) => (
          <Input
            label="Email"
            placeholder="you@example.com"
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
        name="password"
        render={({ field: { value, onChange } }) => (
          <Input
            label="Password"
            placeholder="••••••••"
            value={value}
            onChangeText={onChange}
            secureTextEntry
            error={errors.password?.message}
          />
        )}
      />

      <Button title="Sign In →" onPress={handleSubmit(submit)} loading={isLoading} />

      <Divider label="or continue with" />

      <View className="flex-row gap-2.5">
        <SocialButton provider="google" />
        <SocialButton provider="github" />
      </View>
    </View>
  );
}
