import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await getSupabaseBrowserClient().auth.getSession();
  const token = data.session?.access_token;
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(path, { ...init, headers });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || `Request failed (${response.status})`);
  }
  return payload;
}
