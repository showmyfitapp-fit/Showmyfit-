import {
  toCanonicalIndiaPhone,
  toMsg91Identifier,
} from '@/lib/auth/phone';

const MSG91_WIDGET_BASE = 'https://control.msg91.com/api/v5/widget';

type Msg91ApiResponse = {
  type?: string;
  message?: string | Record<string, unknown>;
  reqId?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
};

function getWidgetConfig() {
  const widgetId = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID;
  const authkey = process.env.MSG91_AUTH_KEY;
  const tokenAuth =
    process.env.MSG91_WIDGET_TOKEN ||
    process.env.NEXT_PUBLIC_MSG91_AUTH_TOKEN;

  if (!widgetId) {
    throw new Error('Missing NEXT_PUBLIC_MSG91_WIDGET_ID');
  }
  if (!authkey && !tokenAuth) {
    throw new Error('Missing MSG91_AUTH_KEY or MSG91 widget token');
  }

  return { widgetId, authkey, tokenAuth };
}

function extractStringField(
  response: Msg91ApiResponse,
  keys: string[] = ['message', 'reqId']
): string {
  for (const key of keys) {
    const value = response[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  if (response.data && typeof response.data === 'object') {
    for (const key of keys) {
      const value = response.data[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
  }
  if (response.message && typeof response.message === 'object') {
    const nested = response.message as Record<string, unknown>;
    for (const key of keys) {
      const value = nested[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
  }
  return '';
}

function assertMsg91Success(response: Msg91ApiResponse, fallback: string) {
  const type = typeof response.type === 'string' ? response.type.toLowerCase() : '';
  const message =
    typeof response.message === 'string'
      ? response.message.trim()
      : '';

  const isAuthFailure =
    message.toLowerCase() === 'authenticationfailure' ||
    message.toLowerCase() === 'authentication failure';

  if (type === 'error' || isAuthFailure) {
    if (isAuthFailure) {
      throw new Error(
        'MSG91 AuthenticationFailure: check MSG91_AUTH_KEY and widget token in env, ensure the token is Enabled in MSG91 → Tokens, and that your IP is not blocked under token IP settings.'
      );
    }
    throw new Error(message || fallback);
  }
}

async function msg91WidgetPost(
  path: string,
  body: Record<string, unknown>
): Promise<Msg91ApiResponse> {
  const { widgetId, authkey, tokenAuth } = getWidgetConfig();

  const payload: Record<string, unknown> = {
    widgetId,
    ...body,
  };

  // Prefer account authkey for server-side widget APIs; fall back to widget token.
  if (authkey) payload.authkey = authkey;
  if (tokenAuth) payload.tokenAuth = tokenAuth;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (authkey) headers.authkey = authkey;
  if (tokenAuth) {
    headers.tokenauth = tokenAuth;
    headers.tokenAuth = tokenAuth;
  }

  const response = await fetch(`${MSG91_WIDGET_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const raw = (await response.json().catch(() => ({}))) as Msg91ApiResponse;

  if (!response.ok) {
    const message =
      typeof raw.message === 'string' ? raw.message : `MSG91 ${path} failed`;
    if (message.toLowerCase().includes('authentication')) {
      throw new Error(
        'MSG91 AuthenticationFailure: use a valid Enabled OTP Widget token / authkey in env, and unblock your IP under MSG91 → Tokens → IP settings.'
      );
    }
    throw new Error(message);
  }

  assertMsg91Success(raw, `MSG91 ${path} failed`);
  return raw;
}

export async function msg91SendOtp(phoneInput: string): Promise<{ reqId: string }> {
  const phone = toCanonicalIndiaPhone(phoneInput);
  const identifier = toMsg91Identifier(phoneInput);
  if (!phone || !identifier) {
    throw new Error('Enter a valid 10-digit Indian mobile number');
  }

  const raw = await msg91WidgetPost('/sendOtp', { identifier });
  const reqId = extractStringField(raw, ['message', 'reqId']);
  if (!reqId) throw new Error('MSG91 did not return a request id');
  return { reqId };
}

export async function msg91RetryOtp(reqId: string): Promise<void> {
  if (!reqId) throw new Error('Missing OTP request id');
  await msg91WidgetPost('/retryOtp', {
    reqId,
    retryChannel: 11, // SMS
  });
}

export async function msg91VerifyOtp(
  reqId: string,
  otp: string
): Promise<{ accessToken: string }> {
  if (!reqId) throw new Error('Missing OTP request id');
  const cleaned = String(otp || '').replace(/\D/g, '');
  if (cleaned.length !== 4) throw new Error('Enter the 4-digit OTP');

  const raw = await msg91WidgetPost('/verifyOtp', {
    reqId,
    otp: cleaned,
  });

  const accessToken = extractStringField(raw, ['message', 'accessToken', 'token']);
  if (!accessToken) throw new Error('MSG91 did not return an access token');
  return { accessToken };
}
