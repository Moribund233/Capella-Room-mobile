/**
 * Full-screen loading indicator shown while app resources initialize.
 */

import { View, ActivityIndicator } from "react-native";

/**
 * Render a centered spinner.
 *
 * @returns A React element.
 */
export function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-cream">
      <ActivityIndicator size="large" color="#2563EB" />
    </View>
  );
}
