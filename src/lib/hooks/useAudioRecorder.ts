/**
 * Hook for recording short audio clips using expo-av.
 */

import { useState, useRef, useCallback } from "react";
import { Alert } from "react-native";
import { Audio } from "expo-av";
import { RecordingOptionsPresets } from "expo-av/build/Audio/RecordingConstants";

export interface RecordingResult {
  uri: string;
  durationMillis: number;
}

/**
 * Start, stop and manage a voice recording session.
 *
 * @returns Recording controls and state.
 */
export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [durationMillis, setDurationMillis] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const requestPermissions = useCallback(async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Microphone access is needed to record voice messages.",
      );
      return false;
    }
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    return true;
  }, []);

  const startRecording = useCallback(async () => {
    if (recordingRef.current) return;
    const granted = await requestPermissions();
    if (!granted) return;

    const { recording } = await Audio.Recording.createAsync(
      RecordingOptionsPresets.HIGH_QUALITY,
    );
    recordingRef.current = recording;
    setIsRecording(true);
    setDurationMillis(0);
    durationIntervalRef.current = setInterval(() => {
      setDurationMillis((prev) => prev + 100);
    }, 100);
  }, [requestPermissions]);

  const stopRecording = useCallback(async (): Promise<RecordingResult | null> => {
    const recording = recordingRef.current;
    if (!recording) return null;

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    setIsRecording(false);
    const status = (await recording.stopAndUnloadAsync()) as
      { durationMillis?: number } | undefined;
    const uri = recording.getURI();
    recordingRef.current = null;

    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

    if (!uri) return null;
    return {
      uri,
      durationMillis: status?.durationMillis ?? durationMillis,
    };
  }, [durationMillis]);

  const cancelRecording = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording) return;
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    setIsRecording(false);
    setDurationMillis(0);
    await recording.stopAndUnloadAsync();
    recordingRef.current = null;
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
  }, []);

  return {
    isRecording,
    durationMillis,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
