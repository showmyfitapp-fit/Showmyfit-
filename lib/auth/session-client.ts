type SessionPayload = {
  user?: any | null;
  access_token?: string | null;
  expires_at?: number | null;
  error?: string;
};

let accessToken: string | null = null;
let expiresAtMs = 0;
let inflight: Promise<string | null> | null = null;

export function cacheAccessToken(token?: string | null, expiresAt?: number | null) {
  accessToken = token || null;
  expiresAtMs = accessToken
    ? expiresAt
      ? expiresAt * 1000
      : Date.now() + 50 * 60 * 1000
    : 0;
}

export function getCachedAccessToken() {
  return accessToken;
}

export function clearCachedAccessToken() {
  accessToken = null;
  expiresAtMs = 0;
}

async function readSessionResponse(path: string, init?: RequestInit): Promise<SessionPayload> {
  const response = await fetch(path, {
    credentials: 'include',
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers || {}),
    },
  });
  const payload = (await response.json().catch(() => ({}))) as SessionPayload;
  if (!response.ok) {
    throw new Error(payload.error || `Auth request failed (${response.status})`);
  }
  if ('access_token' in payload) {
    cacheAccessToken(payload.access_token, payload.expires_at);
  }
  return payload;
}

export async function authRequest<T = SessionPayload>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const payload = await readSessionResponse(path, init);
  return payload as T;
}

async function migrateLegacyLocalSession() {
  if (typeof window === 'undefined') return;
  try {
    const key = Object.keys(window.localStorage).find(
      (item) => item.startsWith('sb-') && item.includes('-auth-token')
    );
    if (!key) return;
    const parsed = JSON.parse(window.localStorage.getItem(key) || '');
    if (!parsed?.access_token || !parsed?.refresh_token) return;
    await readSessionResponse('/api/auth/session', {
      method: 'POST',
      body: JSON.stringify({
        access_token: parsed.access_token,
        refresh_token: parsed.refresh_token,
      }),
    });
    window.localStorage.removeItem(key);
  } catch {
    // Ignore leftover client sessions that cannot be migrated.
  }
}

export async function restoreSession() {
  try {
    await migrateLegacyLocalSession();
    const payload = await readSessionResponse('/api/auth/session');
    return payload.user || null;
  } catch {
    clearCachedAccessToken();
    return null;
  }
}

export async function ensureAccessToken(): Promise<string | null> {
  if (accessToken && Date.now() < expiresAtMs - 30_000) return accessToken;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const path = accessToken ? '/api/auth/refresh' : '/api/auth/session';
      const payload = await readSessionResponse(path, {
        method: accessToken ? 'POST' : 'GET',
      });
      return payload.access_token || null;
    } catch {
      clearCachedAccessToken();
      return null;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
