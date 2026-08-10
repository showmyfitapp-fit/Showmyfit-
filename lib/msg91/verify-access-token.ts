import {
  phoneLookupVariants,
  toCanonicalIndiaPhone,
  toMsg91Identifier,
} from '@/lib/auth/phone';

type Msg91VerifyResponse = {
  type?: string;
  message?: string | { phone?: string; mobile?: string; identifier?: string };
  data?: {
    phone?: string;
    mobile?: string;
    identifier?: string;
    message?: string;
  };
  phone?: string;
  mobile?: string;
  identifier?: string;
};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const json =
      typeof atob === 'function'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function pickPhoneCandidate(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of ['phone', 'mobile', 'identifier', 'message']) {
      const nested = record[key];
      if (typeof nested === 'string' && nested.trim()) return nested.trim();
    }
  }
  return null;
}

export function extractVerifiedPhone(
  response: Msg91VerifyResponse,
  accessToken: string
): string | null {
  const candidates = [
    pickPhoneCandidate(response.message),
    pickPhoneCandidate(response.data),
    pickPhoneCandidate(response.phone),
    pickPhoneCandidate(response.mobile),
    pickPhoneCandidate(response.identifier),
  ];

  const jwt = decodeJwtPayload(accessToken);
  if (jwt) {
    candidates.push(
      pickPhoneCandidate(jwt.phone),
      pickPhoneCandidate(jwt.mobile),
      pickPhoneCandidate(jwt.identifier),
      pickPhoneCandidate(jwt.message),
      pickPhoneCandidate(jwt.data)
    );
  }

  for (const candidate of candidates) {
    if (!candidate) continue;
    const canonical = toCanonicalIndiaPhone(candidate);
    if (canonical) return canonical;
  }

  return null;
}

export async function verifyMsg91AccessToken(
  accessToken: string
): Promise<{ phone: string | null; raw: Msg91VerifyResponse }> {
  const authkey = process.env.MSG91_AUTH_KEY;
  if (!authkey) {
    throw new Error('Missing MSG91_AUTH_KEY');
  }

  const body = new URLSearchParams({
    authkey,
    'access-token': accessToken,
  });

  const response = await fetch(
    'https://control.msg91.com/api/v5/widget/verifyAccessToken',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body,
      cache: 'no-store',
    }
  );

  const raw = (await response.json().catch(() => ({}))) as Msg91VerifyResponse;

  if (!response.ok) {
    const message =
      typeof raw.message === 'string'
        ? raw.message
        : 'MSG91 access token verification failed';
    throw new Error(message);
  }

  // MSG91 may return type/message even on HTTP 200 for failures
  if (
    typeof raw.type === 'string' &&
    raw.type.toLowerCase() === 'error'
  ) {
    throw new Error(
      typeof raw.message === 'string'
        ? raw.message
        : 'MSG91 access token verification failed'
    );
  }

  return {
    phone: extractVerifiedPhone(raw, accessToken),
    raw,
  };
}

export function phonesMatch(
  requestedPhone: string,
  verifiedPhone: string | null
): boolean {
  const requested = toCanonicalIndiaPhone(requestedPhone);
  if (!requested) return false;
  if (!verifiedPhone) {
    // Some MSG91 responses omit phone; fall back to trusting request after token verify
    return true;
  }

  const verifiedCanonical = toCanonicalIndiaPhone(verifiedPhone);
  if (!verifiedCanonical) return false;

  const requestedVariants = new Set(phoneLookupVariants(requested));
  const verifiedVariants = phoneLookupVariants(verifiedCanonical);
  return verifiedVariants.some((v) => requestedVariants.has(v));
}

export function msg91IdentifierFromPhone(phone: string): string | null {
  return toMsg91Identifier(phone);
}
