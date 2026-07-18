/**
 * Decorative auth background: gradient + soft blurred blobs.
 *
 * Matches the `auth-bg` region from the mobile prototype.
 */

import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

/**
 * Render the auth background layer.
 *
 * @returns A React element.
 */
export function AuthBackground() {
  return (
    <View pointerEvents="none" className="absolute left-0 right-0 top-0 h-[55%]">
      <LinearGradient
        colors={["#EFF6FF", "#FFF7ED", "#ECFDF5"]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <View
          className="absolute -right-10 -top-8 h-[200px] w-[200px] rounded-full"
          style={{ backgroundColor: "rgba(123,106,232,0.15)" }}
        />
        <View
          className="absolute -left-8 bottom-10 h-[160px] w-[160px] rounded-full"
          style={{ backgroundColor: "rgba(244,162,97,0.12)" }}
        />
        <View
          className="absolute right-[20%] top-[40%] h-[100px] w-[100px] rounded-full"
          style={{ backgroundColor: "rgba(94,196,160,0.12)" }}
        />
      </LinearGradient>
    </View>
  );
}
