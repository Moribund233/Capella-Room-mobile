import { request, ApiError, API_BASE_URL } from "./client";
import { getAccessToken } from "@/lib/auth/token";

export type FileCategory = "images" | "documents" | "videos" | "audio" | "others";
export type FileUsageType = "message" | "avatar" | "room" | "general";

export interface UploaderInfo {
  id: string;
  username: string;
  avatar_url: string | null;
}

export interface FileInfo {
  id: string;
  original_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  category: FileCategory;
  usage_type: FileUsageType;
  uploader: UploaderInfo | null;
  created_at: string;
}

interface ChunkedSession {
  session_id: string;
  filename: string;
  total_chunks: number;
  file_size: number;
  status: string;
}

interface ChunkedStatus {
  session_id: string;
  uploaded_chunks: number[];
  total_chunks: number;
  status: string;
}

/**
 * Upload helper that uses raw fetch so the runtime can set the multipart
 * Content-Type boundary automatically (the shared `request` function would
 * override it with "application/json").
 */
async function uploadRequest<T>(path: string, formData: FormData): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });

  const body = await response.json();

  if (!body.success) {
    throw new ApiError(
      response.status,
      body.code ?? "UNKNOWN_ERROR",
      body.message ?? "Unknown error",
    );
  }

  return body.data as T;
}

export async function uploadFile(formData: FormData): Promise<FileInfo> {
  return uploadRequest<FileInfo>("/api/v1/upload", formData);
}

export async function uploadImage(formData: FormData): Promise<FileInfo> {
  return uploadRequest<FileInfo>("/api/v1/upload/image", formData);
}

export async function uploadAvatar(formData: FormData): Promise<FileInfo> {
  return uploadRequest<FileInfo>("/api/v1/upload/avatar", formData);
}

export async function getFiles(): Promise<FileInfo[]> {
  return request<FileInfo[]>("/api/v1/files", { method: "GET" });
}

export async function getFile(fileId: string): Promise<FileInfo> {
  return request<FileInfo>(`/api/v1/files/${fileId}`, { method: "GET" });
}

export async function deleteFile(fileId: string): Promise<unknown> {
  return request(`/api/v1/files/${fileId}`, { method: "DELETE" });
}

export async function initChunkedUpload(
  filename: string,
  totalChunks: number,
  fileSize: number,
  mimeType: string,
): Promise<ChunkedSession> {
  return request<ChunkedSession>("/api/v1/upload/chunked/init", {
    method: "POST",
    body: JSON.stringify({
      filename,
      total_chunks: totalChunks,
      file_size: fileSize,
      mime_type: mimeType,
    }),
  });
}

export async function uploadChunk(
  sessionId: string,
  chunkIndex: number,
  chunk: Blob,
): Promise<unknown> {
  const token = getAccessToken();
  const formData = new FormData();
  formData.append("chunk", chunk);

  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}/api/v1/upload/chunked/${sessionId}/${chunkIndex}`,
    {
      method: "POST",
      headers,
      body: formData,
    },
  );

  const body = await response.json();

  if (!body.success) {
    throw new ApiError(
      response.status,
      body.code ?? "UNKNOWN_ERROR",
      body.message ?? "Unknown error",
    );
  }

  return body.data;
}

export async function getChunkedStatus(sessionId: string): Promise<ChunkedStatus> {
  return request<ChunkedStatus>(`/api/v1/upload/chunked/${sessionId}/status`, {
    method: "GET",
  });
}

export async function completeChunkedUpload(sessionId: string): Promise<FileInfo> {
  return request<FileInfo>(`/api/v1/upload/chunked/${sessionId}/complete`, {
    method: "POST",
  });
}

export async function cancelChunkedUpload(sessionId: string): Promise<unknown> {
  return request(`/api/v1/upload/chunked/${sessionId}`, { method: "DELETE" });
}

export type { ChunkedSession, ChunkedStatus };
