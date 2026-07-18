import { request, ApiError, API_BASE_URL } from './client';

interface FileInfo {
  id: string;
  filename: string;
  file_url: string;
  file_type: string;
  file_size: number;
  mime_type: string;
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
 * Upload helper that uses raw fetch so the browser can set the multipart
 * Content-Type boundary automatically (the shared `request` function would
 * override it with "application/json").
 */
async function uploadRequest<T>(path: string, formData: FormData, token: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const body = await response.json();

  if (!body.success) {
    throw new ApiError(
      response.status,
      body.code ?? 'UNKNOWN_ERROR',
      body.message ?? 'Unknown error',
    );
  }

  return body.data as T;
}

export async function uploadFile(
  token: string,
  formData: FormData,
): Promise<FileInfo> {
  return uploadRequest<FileInfo>('/api/v1/upload', formData, token);
}

export async function uploadImage(
  token: string,
  formData: FormData,
): Promise<FileInfo> {
  return uploadRequest<FileInfo>('/api/v1/upload/image', formData, token);
}

export async function uploadAvatar(
  token: string,
  formData: FormData,
): Promise<FileInfo> {
  return uploadRequest<FileInfo>('/api/v1/upload/avatar', formData, token);
}

export async function getFiles(token: string): Promise<FileInfo[]> {
  return request<FileInfo[]>('/api/v1/files', { method: 'GET' }, token);
}

export async function getFile(token: string, fileId: string): Promise<FileInfo> {
  return request<FileInfo>(`/api/v1/files/${fileId}`, { method: 'GET' }, token);
}

export async function deleteFile(
  token: string,
  fileId: string,
): Promise<unknown> {
  return request(`/api/v1/files/${fileId}`, { method: 'DELETE' }, token);
}

export async function initChunkedUpload(
  token: string,
  filename: string,
  totalChunks: number,
  fileSize: number,
  mimeType: string,
): Promise<ChunkedSession> {
  return request<ChunkedSession>(
    '/api/v1/upload/chunked/init',
    {
      method: 'POST',
      body: JSON.stringify({
        filename,
        total_chunks: totalChunks,
        file_size: fileSize,
        mime_type: mimeType,
      }),
    },
    token,
  );
}

export async function uploadChunk(
  token: string,
  sessionId: string,
  chunkIndex: number,
  chunk: Blob,
): Promise<unknown> {
  const formData = new FormData();
  formData.append('chunk', chunk);

  const response = await fetch(
    `${API_BASE_URL}/api/v1/upload/chunked/${sessionId}/${chunkIndex}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    },
  );

  const body = await response.json();

  if (!body.success) {
    throw new ApiError(
      response.status,
      body.code ?? 'UNKNOWN_ERROR',
      body.message ?? 'Unknown error',
    );
  }

  return body.data;
}

export async function getChunkedStatus(
  token: string,
  sessionId: string,
): Promise<ChunkedStatus> {
  return request<ChunkedStatus>(
    `/api/v1/upload/chunked/${sessionId}/status`,
    { method: 'GET' },
    token,
  );
}

export async function completeChunkedUpload(
  token: string,
  sessionId: string,
): Promise<FileInfo> {
  return request<FileInfo>(
    `/api/v1/upload/chunked/${sessionId}/complete`,
    { method: 'POST' },
    token,
  );
}

export async function cancelChunkedUpload(
  token: string,
  sessionId: string,
): Promise<unknown> {
  return request(
    `/api/v1/upload/chunked/${sessionId}`,
    { method: 'DELETE' },
    token,
  );
}

export type { FileInfo, ChunkedSession, ChunkedStatus };
