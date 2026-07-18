import { useEffect } from "react";
import { useRouter, type Href } from "expo-router";
import { useAuthStore } from "@/lib/store/auth";

export default function Index() {
  const router = useRouter();
  const { user, isHydrating } = useAuthStore();

  useEffect(() => {
    if (isHydrating) return;

    if (user) {
      router.replace("/(tabs)" as Href);
    } else {
      router.replace("/(auth)" as Href);
    }
  }, [user, isHydrating, router]);

  return null;
}
