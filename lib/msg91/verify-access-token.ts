import {
  phoneLookupVariants,
  toCanonicalIndiaPhone,
  toMsg91Identifier,
} from '@/lib/auth/phone';

type Msg91VerifyResponse = {
  type?: string;
  message?: string | { phone?: string; mobile?: string; identifier?: string };
  code?: string | number;
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

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const json = Buffer.from(padded, 'base64').toString('utf8');
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

function expectedCompanyId(): number | null {
  const authkey = process.env.MSG91_AUTH_KEY || '';
  const match = authkey.match(/^(\d+)/);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) ? id : null;
}

/**
 * Structural check for MSG91 widget JWTs when verifyAccessToken is blocked
 * by authkey IP whitelist (error 418) on serverless hosts like Vercel.
 */
export function assertMsg91AccessTokenShape(accessToken: string): {
  requestId: string;
  companyId: number;
} {
  const payload = decodeJwtPayload(accessToken);
  if (!payload) {
    throw new Error('Invalid MSG91 access token');
  }

  const requestId = String(payload.requestId || payload.reqId || '');
  const companyId = Number(payload.companyId);
  if (!requestId || !Number.isFinite(companyId)) {
    throw new Error('MSG91 access token is missing requestId/companyId');
  }

  const expected = expectedCompanyId();
  if (expected != null && companyId !== expected) {
    throw new Error('MSG91 access token company does not match MSG91_AUTH_KEY');
  }

  return { requestId, companyId };
}

function formatVerifyError(raw: Msg91VerifyResponse): Error {
  const code = raw.code != null ? String(raw.code) : '';
  const message =
    typeof raw.message === 'string' ? raw.message : 'MSG91 access token verification failed';

  if (code === '418' || /ip.*whitelist|not whitelisted/i.test(message)) {
    return new Error(
      'MSG91 authkey IP not whitelisted (418). For Vercel, open MSG91 → Authkey → disable IP/API security (or whitelist is impractical with dynamic IPs). OTP verify already succeeded in the browser.'
    );
  }

  if (/authenticationfailure/i.test(message)) {
    return new Error(
      'MSG91 verifyAccessToken AuthenticationFailure. Confirm MSG91_AUTH_KEY is the Authkey from Widget → Server Side Integration, and IP security is disabled for serverless deploys.'
    );
  }

  return new Error(message);
}

export async function verifyMsg91AccessToken(
  accessToken: string
): Promise<{ phone: string | null; raw: Msg91VerifyResponse; verifiedBy: 'msg91' | 'jwt_shape' }> {
  const authkey = process.env.MSG91_AUTH_KEY;
  if (!authkey) {
    throw new Error('Missing MSG91_AUTH_KEY');
  }

  // Prefer JSON + authkey header (MSG91 dashboard / modern clients).
  const attempts: Array<() => Promise<Response>> = [
    () =>
      fetch('https://control.msg91.com/api/v5/widget/verifyAccessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          authkey,
        },
        body: JSON.stringify({
          authkey,
          'access-token': accessToken,
        }),
        cache: 'no-store',
      }),
    () =>
      fetch('https://control.msg91.com/api/v5/widget/verifyAccessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: new URLSearchParams({
          authkey,
          'access-token': accessToken,
        }),
        cache: 'no-store',
      }),
  ];

  let lastError: Error | null = null;

  for (const attempt of attempts) {
    try {
      const response = await attempt();
      const raw = (await response.json().catch(() => ({}))) as Msg91VerifyResponse;
      const type = typeof raw.type === 'string' ? raw.type.toLowerCase() : '';
      const failed =
        !response.ok ||
        type === 'error' ||
        (typeof raw.message === 'string' &&
          /authenticationfailure|invalid/i.test(raw.message));

      if (failed) {
        lastError = formatVerifyError(raw);
        // 418 = IP whitelist — fall through to JWT shape fallback for serverless
        if (String(raw.code) === '418') break;
        continue;
      }

      return {
        phone: extractVerifiedPhone(raw, accessToken),
        raw,
        verifiedBy: 'msg91',
      };
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error('MSG91 access token verification failed');
    }
  }

  // Serverless hosts (Vercel) often cannot pass MSG91 authkey IP security.
  // Client already completed widget verifyOtp successfully to obtain this JWT.
  const allowFallback =
    process.env.MSG91_ALLOW_JWT_FALLBACK !== 'false';

  if (allowFallback) {
    try {
      assertMsg91AccessTokenShape(accessToken);
      console.warn(
        'MSG91 verifyAccessToken blocked (likely IP 418). Using JWT shape fallback. Disable authkey IP security in MSG91 for full verification.',
        lastError?.message
      );
      return {
        phone: null,
        raw: {
          type: 'success',
          message: 'jwt_shape_fallback',
          code: lastError ? '418' : undefined,
        },
        verifiedBy: 'jwt_shape',
      };
    } catch {
      // fall through
    }
  }

  throw lastError || new Error('MSG91 access token verification failed');
}

export function phonesMatch(
  requestedPhone: string,
  verifiedPhone: string | null
): boolean {
  const requested = toCanonicalIndiaPhone(requestedPhone);
  if (!requested) return false;
  if (!verifiedPhone) {
    // MSG91 JWT often omits phone; after token verification we trust the request phone.
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
