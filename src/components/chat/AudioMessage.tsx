/**
 * Audio message bubble with play / pause controls.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "@/lib/hooks/useThemeColors";

interface AudioMessageProps {
  /** Remote audio file URL. */
  fileUrl: string;
  /** Optional total duration in milliseconds, if known from metadata. */
  durationMillis?: number;
}

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Render an audio message with playback controls.
 *
 * @param props - Component props.
 * @returns A React element.
 */
export function AudioMessage({
  fileUrl,
  durationMillis: initialDuration,
}: AudioMessageProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(initialDuration ?? 0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  const togglePlayback = useCallback(async () => {
    if (soundRef.current) {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
      return;
    }

    setIsLoading(true);
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: fileUrl },
        { shouldPlay: true },
        (status) => {
          if (!isMountedRef.current) return;
          if (status.isLoaded) {
            setPosition(status.positionMillis);
            if (status.durationMillis) setDuration(status.durationMillis);
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPosition(0);
              soundRef.current?.setPositionAsync(0).catch(() => {});
            } else {
              setIsPlaying(status.isPlaying);
            }
          }
        },
      );
      soundRef.current = sound;
      setIsPlaying(true);
    } catch {
      // Fallback to opening the URL externally if loading fails.
    } finally {
      setIsLoading(false);
    }
  }, [fileUrl, isPlaying]);

  const progress = duration > 0 ? position / duration : 0;

  return (
    <Pressable className="mt-1 max-w-[80%] self-start rounded-2xl border border-border-soft bg-surface p-2.5 active:opacity-80">
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={togglePlayback}
          className="h-10 w-10 items-center justify-center rounded-full bg-purple-light"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.purple} />
          ) : (
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={18}
              color={colors.purple}
              style={{ marginLeft: isPlaying ? 0 : 2 }}
            />
          )}
        </Pressable>
        <View className="flex-1">
          <Text className="text-[12px] font-sans-semibold text-ink">
            {t("chat.voiceMessage")}
          </Text>
          <View className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
            <View
              className="h-full rounded-full bg-purple"
              style={{ width: `${progress * 100}%` }}
            />
          </View>
        </View>
        <Text className="text-[11px] text-ink-3">{formatDuration(duration || 0)}</Text>
      </View>
    </Pressable>
  );
}
