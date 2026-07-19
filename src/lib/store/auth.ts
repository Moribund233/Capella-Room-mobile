import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import {
  loginApi,
  registerApi,
  refreshApi,
  sendRegisterCodeApi,
  v2RegisterApi,
  sendLoginCodeApi,
  v2LoginWithCodeApi,
  v2LoginWithPasswordApi,
} from "../api/auth";
import { setAuthGetters } from "@/lib/auth/token";
import { resetLocalDatabase } from "@/lib/db/database";
import type { User } from "../api/auth";

function getDeviceName(): string {
  if (Platform.OS === "android") return "Android";
  if (Platform.OS === "ios") return "iOS";
  return "Unknown Device";
}

function getDeviceType(): string {
  return Platform.OS === "ios" || Platform.OS === "android" ? "mobile" : "unknown";
}

/* ─── Keys ────────────────────────────────────────────────── */

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user";

/* ─── Helpers ─────────────────────────────────────────────── */

async function getItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function setItem(key: string, value: string) {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // Silently fail on secure store errors
  }
}

async function removeItem(key: string) {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // Silently fail
  }
}

/* ─── Store ───────────────────────────────────────────────── */

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  pushToken: string | null;
  isLoading: boolean;
  isHydrating: boolean;

  hydrate: () => Promise<void>;
  setPushToken: (token: string | null) => void;
  setUserStatus: (status: User["status"]) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  loginWithCode: (email: string, code: string) => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  registerWithCode: (
    email: string,
    code: string,
    username: string,
    password: string,
  ) => Promise<void>;
  sendRegisterCode: (email: string) => Promise<{ message: string; code_length: number }>;
  sendLoginCode: (email: string) => Promise<{ message: string; code_length: number }>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  pushToken: null,
  isLoading: false,
  isHydrating: true,

  setPushToken: (token) => set({ pushToken: token }),

  setUserStatus: (status) => {
    const { user } = get();
    if (user) set({ user: { ...user, status } });
  },

  /* ── Hydrate from secure store on app start ── */
  hydrate: async () => {
    try {
      const [accessToken, refreshToken, userJson] = await Promise.all([
        getItem(ACCESS_TOKEN_KEY),
        getItem(REFRESH_TOKEN_KEY),
        getItem(USER_KEY),
      ]);

      if (accessToken && refreshToken && userJson) {
        set({
          accessToken,
          refreshToken,
          user: JSON.parse(userJson),
          isHydrating: false,
        });
      } else {
        set({ isHydrating: false });
      }
    } catch {
      set({ isHydrating: false });
    }
  },

  /* ── Login (v1, legacy) ── */
  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const result = await loginApi(email, password, getDeviceName(), getDeviceType());
      await Promise.all([
        setItem(ACCESS_TOKEN_KEY, result.access_token),
        setItem(REFRESH_TOKEN_KEY, result.refresh_token),
        setItem(USER_KEY, JSON.stringify(result.user)),
      ]);
      set({
        user: result.user,
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  /* ── Register (v1, legacy, admin-only) ── */
  register: async (username: string, email: string, password: string) => {
    set({ isLoading: true });
    try {
      await registerApi(username, email, password);
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  /* ── v2: register with verification code ── */
  registerWithCode: async (
    email: string,
    code: string,
    username: string,
    password: string,
  ) => {
    set({ isLoading: true });
    try {
      const result = await v2RegisterApi(email, code, username, password);
      await Promise.all([
        setItem(ACCESS_TOKEN_KEY, result.access_token),
        setItem(REFRESH_TOKEN_KEY, result.refresh_token),
        setItem(USER_KEY, JSON.stringify(result.user)),
      ]);
      set({
        user: result.user,
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  /* ── v2: login with verification code ── */
  loginWithCode: async (email: string, code: string) => {
    set({ isLoading: true });
    try {
      const result = await v2LoginWithCodeApi(email, code);
      await Promise.all([
        setItem(ACCESS_TOKEN_KEY, result.access_token),
        setItem(REFRESH_TOKEN_KEY, result.refresh_token),
        setItem(USER_KEY, JSON.stringify(result.user)),
      ]);
      set({
        user: result.user,
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  /* ── v2: login with password ── */
  loginWithPassword: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const result = await v2LoginWithPasswordApi(
        email,
        password,
        getDeviceName(),
        getDeviceType(),
      );
      await Promise.all([
        setItem(ACCESS_TOKEN_KEY, result.access_token),
        setItem(REFRESH_TOKEN_KEY, result.refresh_token),
        setItem(USER_KEY, JSON.stringify(result.user)),
      ]);
      set({
        user: result.user,
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  /* ── v2: send register code ── */
  sendRegisterCode: async (email: string) => {
    const result = await sendRegisterCodeApi(email);
    return result;
  },

  /* ── v2: send login code ── */
  sendLoginCode: async (email: string) => {
    const result = await sendLoginCodeApi(email);
    return result;
  },

  /* ── Logout ── */
  logout: async () => {
    await Promise.all([
      removeItem(ACCESS_TOKEN_KEY),
      removeItem(REFRESH_TOKEN_KEY),
      removeItem(USER_KEY),
      resetLocalDatabase().catch((err) => {
        console.warn("[Auth] Failed to reset local database on logout:", err);
      }),
    ]);
    set({ user: null, accessToken: null, refreshToken: null });
  },

  /* ── Refresh token ── */
  refreshAccessToken: async () => {
    const { refreshToken } = get();
    if (!refreshToken) return null;

    try {
      const result = await refreshApi(refreshToken);
      await Promise.all([
        setItem(ACCESS_TOKEN_KEY, result.access_token),
        setItem(REFRESH_TOKEN_KEY, result.refresh_token),
      ]);
      set({
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
      });
      return result.access_token;
    } catch {
      // Refresh failed — force logout
      await get().logout();
      return null;
    }
  },
}));

/* ── Wire auth getters for the API client ── */
setAuthGetters(
  () => useAuthStore.getState().accessToken,
  () => useAuthStore.getState().refreshAccessToken(),
  () => useAuthStore.getState().logout(),
);
