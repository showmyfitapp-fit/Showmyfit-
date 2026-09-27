import { NextRequest, NextResponse } from 'next/server';
import { createClient, type Session, type User } from '@supabase/supabase-js';
import { getSupabaseAdminClient } from '@/lib/supabase/admin-server';

export const ACCESS_COOKIE = 'smf_at';
export const REFRESH_COOKIE = 'smf_rt';
export const PKCE_COOKIE = 'smf_pkce';
export const NEXT_COOKIE = 'smf_next';

function publicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  return { url, anonKey };
}

function cookieBase(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export function getAnonAuthClient() {
  const { url, anonKey } = publicConfig();
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function getPkceAuthClient(request: NextRequest, bag: { pkce?: string }) {
  const { url, anonKey } = publicConfig();
  return createClient(url, anonKey, {
    auth: {
      flowType: 'pkce',
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: {
        getItem: (key) => {
          if (key.endsWith('-code-verifier')) {
            return bag.pkce ?? request.cookies.get(PKCE_COOKIE)?.value ?? null;
          }
          return null;
        },
        setItem: (key, value) => {
          if (key.endsWith('-code-verifier')) bag.pkce = value;
        },
        removeItem: (key) => {
          if (key.endsWith('-code-verifier')) bag.pkce = '';
        },
      },
    },
  });
}

export function readAccessToken(request: NextRequest) {
  const header = request.headers.get('authorization') || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return request.cookies.get(ACCESS_COOKIE)?.value || '';
}

export function readRefreshToken(request: NextRequest) {
  return request.cookies.get(REFRESH_COOKIE)?.value || '';
}

export function applySessionCookies(response: NextResponse, session: Session) {
  response.cookies.set(ACCESS_COOKIE, session.access_token, cookieBase(session.expires_in || 3600));
  response.cookies.set(REFRESH_COOKIE, session.refresh_token, cookieBase(60 * 60 * 24 * 30));
  response.cookies.set(PKCE_COOKIE, '', { ...cookieBase(0), maxAge: 0 });
  return response;
}

export function applyPkceCookie(response: NextResponse, verifier: string, nextPath?: string) {
  if (verifier) response.cookies.set(PKCE_COOKIE, verifier, cookieBase(10 * 60));
  if (nextPath) response.cookies.set(NEXT_COOKIE, nextPath, cookieBase(10 * 60));
  return response;
}

export function clearSessionCookies(response: NextResponse) {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, PKCE_COOKIE, NEXT_COOKIE]) {
    response.cookies.set(name, '', { ...cookieBase(0), maxAge: 0 });
  }
  return response;
}

export function sessionJson(session: Session, user?: User | null) {
  return {
    user: user || session.user,
    access_token: session.access_token,
    expires_at: session.expires_at,
    expires_in: session.expires_in,
  };
}

export async function loadOrRefreshSession(request: NextRequest) {
  const access = request.cookies.get(ACCESS_COOKIE)?.value || '';
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value || '';

  if (access) {
    const { data, error } = await getSupabaseAdminClient().auth.getUser(access);
    if (!error && data.user) {
      return {
        user: data.user,
        access_token: access,
        refresh_token: refresh,
        expires_at: undefined as number | undefined,
        refreshed: false,
        session: null as Session | null,
      };
    }
  }

  if (!refresh) return null;

  const { data, error } = await getAnonAuthClient().auth.refreshSession({
    refresh_token: refresh,
  });
  if (error || !data.session) return null;

  return {
    user: data.session.user,
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
    refreshed: true,
    session: data.session,
  };
}

export function requestOrigin(request: NextRequest) {
  const proto = request.headers.get('x-forwarded-proto') || request.nextUrl.protocol.replace(':', '');
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host;
  return `${proto}://${host}`;
}
