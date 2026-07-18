import { Redirect } from "expo-router";
import { useAuthStore } from "../lib/store/auth";

export default function Index() {
  const { user, isHydrating } = useAuthStore();

  if (isHydrating) return null;

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)" />;
}
