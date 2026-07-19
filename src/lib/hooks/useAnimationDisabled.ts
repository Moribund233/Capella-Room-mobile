/**
 * Hook that returns whether animations should be disabled.
 *
 * Combines the system-level reduced motion preference with the user's
 * accessibility setting from the server.
 */

import { useReducedMotion } from "react-native-reanimated";

import { useSettings } from "./useSettingsQuery";

/**
 * @returns `true` if animations should be disabled.
 */
export function useAnimationDisabled(): boolean {
  const systemReduced = useReducedMotion();
  const { data: settings } = useSettings();
  const userReduced = settings?.accessibility.reduce_motion ?? false;
  return systemReduced || userReduced;
}
