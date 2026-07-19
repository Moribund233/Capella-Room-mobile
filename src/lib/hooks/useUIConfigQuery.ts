import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "./queryClient";
import * as uiConfigApi from "../api/ui-config";
import { useAuthStore } from "../store/auth";

export const uiConfigKeys = {
  all: ["ui-config"] as const,
};

export function useUIConfig() {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: uiConfigKeys.all,
    queryFn: () => uiConfigApi.getUIConfig(),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveUIConfig() {
  return useMutation({
    mutationFn: (config: Partial<uiConfigApi.UIConfig>) => uiConfigApi.saveUIConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: uiConfigKeys.all });
    },
  });
}

export function useResetUIConfig() {
  return useMutation({
    mutationFn: () => uiConfigApi.resetUIConfig(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: uiConfigKeys.all });
    },
  });
}
