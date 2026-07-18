import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "./queryClient";
import * as usersApi from "../api/users";
import { useAuthStore } from "../store/auth";

/* ─── Query Keys ─────────────────────────────────────────────── */

export const securityKeys = {
  overview: ["security", "overview"] as const,
  devices: ["security", "devices"] as const,
  loginHistory: (page: number) => ["security", "login-history", page] as const,
  suspiciousLoginHistory: ["security", "login-history", "suspicious"] as const,
};

/* ─── Queries ────────────────────────────────────────────────── */

export function useSecurityOverview() {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: securityKeys.overview,
    queryFn: () => usersApi.getSecurityOverview(),
    enabled: !!token,
  });
}

export function useDevices() {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: securityKeys.devices,
    queryFn: () => usersApi.getDevices(),
    enabled: !!token,
  });
}

export function useLoginHistory(limit?: number, offset?: number) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: [...securityKeys.loginHistory(0), { limit, offset }],
    queryFn: () => usersApi.getLoginHistory(limit, offset),
    enabled: !!token,
  });
}

/* ─── Mutations ──────────────────────────────────────────────── */

export function useTerminateDevice() {
  return useMutation({
    mutationFn: (deviceId: string) => usersApi.terminateDevice(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: securityKeys.devices });
      queryClient.invalidateQueries({ queryKey: securityKeys.overview });
    },
  });
}

export function useBlockDevice() {
  return useMutation({
    mutationFn: (deviceId: string) => usersApi.blockDevice(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: securityKeys.devices });
      queryClient.invalidateQueries({ queryKey: securityKeys.overview });
    },
  });
}

export function useUnblockDevice() {
  return useMutation({
    mutationFn: (deviceId: string) => usersApi.unblockDevice(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: securityKeys.devices });
      queryClient.invalidateQueries({ queryKey: securityKeys.overview });
    },
  });
}

export function useTerminateAllOtherDevices() {
  return useMutation({
    mutationFn: () => usersApi.terminateAllOtherDevices(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: securityKeys.devices });
      queryClient.invalidateQueries({ queryKey: securityKeys.overview });
    },
  });
}
