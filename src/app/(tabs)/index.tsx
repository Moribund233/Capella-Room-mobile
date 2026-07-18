import { View, Text } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-cream">
      <Text className="text-lg font-sans-semibold text-ink">Messages</Text>
      <Text className="mt-1 text-sm text-ink-3">No conversations yet</Text>
    </View>
  );
}
