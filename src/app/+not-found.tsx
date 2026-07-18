import { View, Text } from "react-native";
import { Link } from "expo-router";

export default function NotFoundScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-surface">
      <Text className="text-4xl font-sans-semibold text-ink-4">404</Text>
      <Text className="mt-2 text-base text-ink-3">Page Not Found</Text>
      <Link href="/" className="mt-4 text-purple underline">
        Go Home
      </Link>
    </View>
  );
}
