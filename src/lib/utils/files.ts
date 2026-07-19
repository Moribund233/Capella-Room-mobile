/**
 * Cross-platform helpers for saving/opening remote files.
 */

import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Linking, Platform } from "react-native";

/**
 * Try to download a remote file to a local cache directory and then share/open it.
 *
 * @param url - Remote file URL.
 * @param filename - Desired local filename.
 * @returns Resolves when the file has been shared/dismissed.
 */
export async function downloadAndOpenFile(url: string, filename?: string): Promise<void> {
  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    throw new Error("Cannot open URL");
  }

  if (Platform.OS === "web") {
    Linking.openURL(url);
    return;
  }

  const name = filename ?? url.split("/").pop() ?? "download";
  const localUri = FileSystem.cacheDirectory + name;
  const download = FileSystem.createDownloadResumable(url, localUri);
  const result = await download.downloadAsync();
  if (!result?.uri) {
    throw new Error("Download failed");
  }

  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(result.uri);
  } else {
    Linking.openURL(result.uri);
  }
}
