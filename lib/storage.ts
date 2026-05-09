import { supabase } from './supabase';

export const STORAGE_BUCKETS = {
  materials: 'user-materials',
  whiteboards: 'whiteboards'
} as const;

export const MATERIAL_LIMITS = {
  pdf: 25 * 1024 * 1024,
  slides: 25 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  audio: 25 * 1024 * 1024
} as const;

export const buildMaterialPath = (userId: string, materialId: string, fileName: string) => {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${userId}/${materialId}/${safeName}`;
};

export const buildWhiteboardSnapshotPath = (userId: string, subjectId: string, boardId: string) =>
  `${userId}/${subjectId}/${boardId}/snapshot.jpg`;

export async function uploadFileToStorage(
  bucket: string,
  path: string,
  file: File | Blob,
  contentType?: string
) {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType
  });
  if (error) throw error;
}

export async function uploadDataUrlToStorage(bucket: string, path: string, dataUrl: string) {
  const [header, body] = dataUrl.split(',');
  if (!header || !body) throw new Error('Invalid data url');
  const mimeType = header.match(/data:(.*?);base64/)?.[1] || 'application/octet-stream';
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: mimeType });
  await uploadFileToStorage(bucket, path, blob, mimeType);
}

export async function createSignedUrl(bucket: string, path: string, expiresIn = 3600) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}
