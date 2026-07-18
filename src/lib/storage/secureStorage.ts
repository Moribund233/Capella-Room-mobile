/**
 * Zustand persist storage adapter backed by `expo-secure-store`.
 *
 * SecureStore is supported out-of-the-box by Expo Go and has a 2KB value
 * limit, which is more than enough for small persisted states like theme
 * mode and language locale.
 */

import * as SecureStore from "expo-secure-store";
import type { StateStorage } from "zustand/middleware";

/**
 * A Zustand-compatible storage adapter that reads/writes JSON strings via
 * Expo SecureStore.
 */
export const secureStorage: StateStorage = {
  /**
   * Retrieve an item from secure storage.
   *
   * @param name - Storage key.
   * @returns The stored JSON string, or null when missing.
   */
  getItem: async (name) => {
    try {
      const value = await SecureStore.getItemAsync(name);
      return value;
    } catch {
      return null;
    }
  },

  /**
   * Persist an item to secure storage.
   *
   * @param name - Storage key.
   * @param value - JSON string to store.
   */
  setItem: async (name, value) => {
    await SecureStore.setItemAsync(name, value);
  },

  /**
   * Remove an item from secure storage.
   *
   * @param name - Storage key.
   */
  removeItem: async (name) => {
    await SecureStore.deleteItemAsync(name);
  },
};
