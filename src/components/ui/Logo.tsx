/**
 * App logo composed of the icon and wordmark.
 */

import { View, Text, Image } from "react-native";

/**
 * Render the Capella logo.
 *
 * @returns A React element.
 */
export function Logo() {
  return (
    <View className="mb-8 flex-row items-center gap-3">
      <Image
        source={require("../../../assets/icon.png")}
        className="h-11 w-11 rounded-[14px]"
        style={{ transform: [{ rotate: "-5deg" }] }}
        resizeMode="cover"
      />
      <Text className="font-display-bold text-[22px] tracking-tight text-ink">
        Capella
      </Text>
    </View>
  );
}
