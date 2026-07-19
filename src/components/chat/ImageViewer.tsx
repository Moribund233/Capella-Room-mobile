/**
 * Full-screen image viewer modal with tap-to-dismiss.
 */

import { Modal, View, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

interface ImageViewerProps {
  /** Remote or local image URI. */
  uri?: string | null;
  /** Whether the viewer is visible. */
  visible: boolean;
  /** Called when the viewer should close. */
  onClose: () => void;
}

/**
 * Render a full-screen image preview modal.
 *
 * @param props - Viewer props.
 * @returns A React element.
 */
export function ImageViewer({ uri, visible, onClose }: ImageViewerProps) {
  const [loading, setLoading] = useState(true);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/90">
        <Pressable
          onPress={onClose}
          className="absolute right-4 top-12 z-10 h-10 w-10 items-center justify-center rounded-full bg-black/40"
        >
          <Ionicons name="close" size={24} color="white" />
        </Pressable>
        <View className="flex-1 items-center justify-center">
          {uri ? (
            <Image
              source={{ uri }}
              className="h-4/5 w-full"
              contentFit="contain"
              transition={200}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
            />
          ) : null}
          {loading && uri && (
            <View className="absolute">
              <ActivityIndicator size="large" color="white" />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
