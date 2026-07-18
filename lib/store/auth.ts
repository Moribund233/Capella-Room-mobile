import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { loginApi, registerApi, refreshApi } from "../api/auth";
import type { User } from "../api/auth";

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
  isLoading: boolean;
  isHydrating: boolean;

  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  isHydrating: true,

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

  /* ── Login ── */
  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const result = await loginApi(email, password);
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

  /* ── Register ── */
  register: async (username: string, email: string, password: string) => {
    set({ isLoading: true });
    try {
      await registerApi(username, email, password);
      set({ isLoading: false });
      // Don't log in automatically — user should go to login tab
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  /* ── Logout ── */
  logout: async () => {
    await Promise.all([
      removeItem(ACCESS_TOKEN_KEY),
      removeItem(REFRESH_TOKEN_KEY),
      removeItem(USER_KEY),
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
