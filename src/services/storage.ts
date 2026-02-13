import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';
import { hasSupabaseConfig } from './supabase';

const BUCKET = 'receipts';
const DOCUMENTS_BUCKET = 'documents';
const INVENTORY_BUCKET = 'inventory';

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/** Upload receipt to bucket "receipts" at path {userId}/{timestamp}.jpg.
 * Throws on error with a clear message. Run docs/supabase-storage-receipts.sql if bucket/policies missing. */
export async function uploadReceipt(
  userId: string,
  localUri: string,
  _fileName?: string
): Promise<string | null> {
  if (!hasSupabaseConfig) {
    throw new Error('Supabase not configured. Add EXPO_PUBLIC_SUPABASE_* to .env.local.');
  }

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
    const msg = error.message ?? 'Upload failed';
    const hint = /bucket|does not exist|policy/i.test(msg)
      ? ' Run docs/supabase-storage-receipts.sql in Supabase SQL Editor.'
      : '';
    throw new Error(`${msg}${hint}`);
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return urlData.publicUrl;
}

/** Upload a document (e.g. W-9) to receipts bucket. Returns public URL or null. */
export async function uploadDocument(
  userId: string,
  localUri: string,
  options?: { mimeType?: string; suffix?: string }
): Promise<string | null> {
  if (!hasSupabaseConfig) return null;

  try {
    const ext = options?.suffix ?? (localUri.toLowerCase().endsWith('.pdf') ? '.pdf' : '.jpg');
    const path = `${userId}/documents/${Date.now()}${ext}`;
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: 'base64',
    });
    const arrayBuffer = base64ToArrayBuffer(base64);
    const contentType = options?.mimeType ?? (ext === '.pdf' ? 'application/pdf' : 'image/jpeg');

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(path, arrayBuffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      if (__DEV__) console.warn('[Storage] uploadDocument error:', error.message);
      return null;
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
    return urlData.publicUrl;
  } catch (e) {
    if (__DEV__) console.warn('[Storage] uploadDocument error:', e);
    return null;
  }
}

/** Upload a file to the dedicated documents bucket. Path: documents/{userId}/{timestamp}-{filename} */
export async function uploadToDocumentsBucket(params: {
  userId: string;
  uri: string;
  filename: string;
}): Promise<string | null> {
  if (!hasSupabaseConfig) return null;

  try {
    const ext = params.filename.includes('.')
      ? params.filename.slice(params.filename.lastIndexOf('.'))
      : '.pdf';
    const safeName = params.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `${params.userId}/${Date.now()}-${safeName}`;

    const base64 = await FileSystem.readAsStringAsync(params.uri, {
      encoding: 'base64',
    });
    const arrayBuffer = base64ToArrayBuffer(base64);

    let contentType = 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (['.jpg', '.jpeg'].includes(ext.toLowerCase())) contentType = 'image/jpeg';
    else if (['.png', '.webp'].includes(ext.toLowerCase())) contentType = `image/${ext.slice(1).toLowerCase()}`;

    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(path, arrayBuffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      if (__DEV__) console.warn('[Storage] uploadToDocumentsBucket error:', error.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(DOCUMENTS_BUCKET)
      .getPublicUrl(data.path);
    return urlData.publicUrl;
  } catch (e) {
    if (__DEV__) console.warn('[Storage] uploadToDocumentsBucket error:', e);
    return null;
  }
}

/** Upload generated text as a .txt file to the documents bucket. Returns public URL or null. */
export async function uploadTextToDocumentsBucket(params: {
  userId: string;
  filename: string;
  content: string;
}): Promise<string | null> {
  if (!hasSupabaseConfig) return null;

  try {
    const slug = params.filename.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\.txt$/, '') || 'document';
    const path = `${params.userId}/${Date.now()}-${slug}.txt`;
    const encoder = new TextEncoder();
    const arrayBuffer = encoder.encode(params.content).buffer;

    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(path, arrayBuffer, {
        contentType: 'text/plain; charset=utf-8',
        upsert: false,
      });

    if (error) {
      if (__DEV__) console.warn('[Storage] uploadTextToDocumentsBucket error:', error.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(DOCUMENTS_BUCKET)
      .getPublicUrl(data.path);
    return urlData.publicUrl;
  } catch (e) {
    if (__DEV__) console.warn('[Storage] uploadTextToDocumentsBucket error:', e);
    return null;
  }
}

/** Upload a PDF file to the documents bucket. Path: documents/{userId}/pdf/{timestamp}-{slug}.pdf */
export async function uploadPdfToDocumentsBucket(params: {
  userId: string;
  filename: string;
  localPath: string;
}): Promise<string | null> {
  if (!hasSupabaseConfig) return null;

  try {
    const slug = params.filename.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\.pdf$/, '') || 'document';
    const path = `${params.userId}/pdf/${Date.now()}-${slug}.pdf`;

    const base64 = await FileSystem.readAsStringAsync(params.localPath, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const arrayBuffer = base64ToArrayBuffer(base64);

    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(path, arrayBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (error) {
      if (__DEV__) console.warn('[Storage] uploadPdfToDocumentsBucket error:', error.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(DOCUMENTS_BUCKET)
      .getPublicUrl(data.path);
    return urlData.publicUrl;
  } catch (e) {
    if (__DEV__) console.warn('[Storage] uploadPdfToDocumentsBucket error:', e);
    return null;
  }
}

/** Upload inventory item photo. Path: inventory/{userId}/{itemId or timestamp}.jpg */
export async function uploadInventoryPhoto(
  userId: string,
  localUri: string,
  itemId?: string
): Promise<string | null> {
  if (!hasSupabaseConfig) return null;

  try {
    const path = `${userId}/${itemId ?? Date.now()}.jpg`;
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: 'base64',
    });
    const arrayBuffer = base64ToArrayBuffer(base64);

    const { data, error } = await supabase.storage
      .from(INVENTORY_BUCKET)
      .upload(path, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      if (__DEV__) console.warn('[Storage] uploadInventoryPhoto error:', error.message);
      return null;
    }

    const { data: urlData } = supabase.storage.from(INVENTORY_BUCKET).getPublicUrl(data.path);
    return urlData.publicUrl;
  } catch (e) {
    if (__DEV__) console.warn('[Storage] uploadInventoryPhoto error:', e);
    return null;
  }
}
