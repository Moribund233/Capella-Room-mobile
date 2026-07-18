import { View, Text } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-[#F7F9FC]">
      <Text className="text-lg font-bold text-[#1E293B]">Messages</Text>
      <Text className="text-sm text-[#94A3B8] mt-1">No conversations yet</Text>
    </View>
  );
}
