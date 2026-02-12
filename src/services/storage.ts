import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';
import { hasSupabaseConfig } from './supabase';

const BUCKET = 'receipts';

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function uploadReceipt(
  userId: string,
  localUri: string,
  _fileName?: string
): Promise<string | null> {
  if (!hasSupabaseConfig) return null;

  try {
    const path = `${userId}/${Date.now()}.jpg`;
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: 'base64',
    });
    const arrayBuffer = base64ToArrayBuffer(base64);

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(path, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      if (__DEV__) console.warn('[Storage] Upload error:', error.message);
      return null;
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
    return urlData.publicUrl;
  } catch (e) {
    if (__DEV__) console.warn('[Storage] uploadReceipt error:', e);
    return null;
  }
}
