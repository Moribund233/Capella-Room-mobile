import { View, Text } from "react-native";
import { Link } from "expo-router";

export default function NotFoundScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-4xl font-bold text-gray-300">404</Text>
      <Text className="mt-2 text-base text-gray-500">Page Not Found</Text>
      <Link href="/" className="mt-4 text-blue-500 underline">
        Go Home
      </Link>
    </View>
  );
}
