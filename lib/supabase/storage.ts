import { getSupabaseBrowserClient } from './client';

/** Public bucket used for product, profile, and banner images. */
export const UPLOADS_BUCKET = 'uploads';

export function getPublicStorageUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  }

  const cleanPath = path.replace(/^\/+/, '');
  return `${base}/storage/v1/object/public/${UPLOADS_BUCKET}/${cleanPath
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function buildUploadPath(folder: string, fileName: string): string {
  const timestamp = Date.now();
  const safeName = sanitizeFileName(fileName);
  const cleanFolder = folder.replace(/^\/+|\/+$/g, '') || 'products';
  return `${cleanFolder}/${timestamp}_${safeName}`;
}

/**
 * Extract object path inside the uploads bucket from a public/signed URL,
 * Firebase legacy URL, or a bare storage path.
 */
export function extractUploadsPath(url: string): string | null {
  if (!url) return null;

  try {
    // Bare path: products/foo.jpg
    if (!url.startsWith('http')) {
      return url.replace(/^\/+/, '');
    }

    // Supabase: .../storage/v1/object/public/uploads/<path>
    // Also signed: .../storage/v1/object/sign/uploads/<path>
    const supabaseMatch = url.match(
      /\/storage\/v1\/object\/(?:public|sign)\/uploads\/([^?]+)/
    );
    if (supabaseMatch?.[1]) {
      return decodeURIComponent(supabaseMatch[1]);
    }

    // Legacy Firebase: .../o/<encodedPath>?...
    const firebaseMatch = url.match(/\/o\/([^?]+)/);
    if (firebaseMatch?.[1]) {
      let decoded = decodeURIComponent(firebaseMatch[1]);
      if (decoded.includes('%')) {
        decoded = decodeURIComponent(decoded);
      }
      return decoded.replace(/~/g, '_');
    }

    // Legacy Firebase app host: ...firebasestorage.app/<path>
    const firebaseAppMatch = url.match(/firebasestorage\.app\/([^?]+)/);
    if (firebaseAppMatch?.[1]) {
      return decodeURIComponent(firebaseAppMatch[1]).replace(/~/g, '_');
    }

    return null;
  } catch {
    return null;
  }
}

export async function uploadToSupabaseStorage(
  file: File | Blob,
  path: string,
  options?: { upsert?: boolean; contentType?: string }
): Promise<string> {
  const client = getSupabaseBrowserClient();
  const contentType =
    options?.contentType ||
    (file instanceof File ? file.type : undefined) ||
    'application/octet-stream';

  const { error } = await client.storage.from(UPLOADS_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: options?.upsert ?? false,
    contentType,
  });

  if (error) {
    throw new Error(error.message || 'Failed to upload image to Supabase Storage');
  }

  const { data } = client.storage.from(UPLOADS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteFromSupabaseStorage(imageUrlOrPath: string): Promise<void> {
  const path = extractUploadsPath(imageUrlOrPath);
  if (!path) {
    console.warn('⚠️ Could not extract storage path from URL:', imageUrlOrPath);
    return;
  }

  const { error } = await getSupabaseBrowserClient()
    .storage.from(UPLOADS_BUCKET)
    .remove([path]);

  if (error) {
    throw new Error(error.message || 'Failed to delete image from Supabase Storage');
  }
}

export async function testSupabaseStorageConnection(): Promise<boolean> {
  try {
    const { error } = await getSupabaseBrowserClient()
      .storage.from(UPLOADS_BUCKET)
      .list('', { limit: 1 });
    if (error) {
      console.error('❌ Supabase Storage connection failed:', error);
      return false;
    }
    console.log('✅ Supabase Storage connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase Storage connection failed:', error);
    return false;
  }
}
