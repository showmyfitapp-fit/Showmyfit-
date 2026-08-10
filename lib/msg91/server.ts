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

function formatMsg91Error(message: string, fallback: string): Error {
  const normalized = message.trim().toLowerCase();

  if (
    normalized === 'invalid request' ||
    normalized === 'invalid_request' ||
    normalized.includes('invalid request')
  ) {
    return new Error(
      'MSG91 Invalid Request: your widget allows India only, but this server request comes from a non-India IP (common on Vercel). Keep send/verify on the browser widget, or set Country Restriction to Allow All in MSG91 widget settings.'
    );
  }

  if (
    normalized === 'authenticationfailure' ||
    normalized === 'authentication failure' ||
    normalized.includes('authentication')
  ) {
    return new Error(
      'MSG91 AuthenticationFailure: ensure the OTP Widget token is Enabled in MSG91 → Tokens, selected in the widget Client Side Integration, and matches NEXT_PUBLIC_MSG91_AUTH_TOKEN / MSG91_WIDGET_TOKEN.'
    );
  }

  return new Error(message || fallback);
}

function assertMsg91Success(response: Msg91ApiResponse, fallback: string) {
  const type = typeof response.type === 'string' ? response.type.toLowerCase() : '';
  const message =
    typeof response.message === 'string' ? response.message.trim() : '';

  if (type === 'error' || message.toLowerCase() === 'invalid request') {
    throw formatMsg91Error(message, fallback);
  }
}

/**
 * Widget send/verify APIs expect the OTP Widget tokenAuth (not account authkey).
 * Do not send both — MSG91 can return "Invalid Request".
 */
async function msg91WidgetPost(
  path: string,
  body: Record<string, unknown>,
  mode: 'token' | 'authkey' = 'token'
): Promise<Msg91ApiResponse> {
  const { widgetId, authkey, tokenAuth } = getWidgetConfig();

  const payload: Record<string, unknown> = {
    widgetId,
    ...body,
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (mode === 'token') {
    if (!tokenAuth) {
      throw new Error('Missing MSG91 widget token (MSG91_WIDGET_TOKEN / NEXT_PUBLIC_MSG91_AUTH_TOKEN)');
    }
    payload.tokenAuth = tokenAuth;
    headers.tokenauth = tokenAuth;
  } else {
    if (!authkey) throw new Error('Missing MSG91_AUTH_KEY');
    payload.authkey = authkey;
    headers.authkey = authkey;
  }

  const response = await fetch(`${MSG91_WIDGET_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const raw = (await response.json().catch(() => ({}))) as Msg91ApiResponse;
  const message =
    typeof raw.message === 'string' ? raw.message : `MSG91 ${path} failed`;

  if (!response.ok) {
    throw formatMsg91Error(message, `MSG91 ${path} failed`);
  }

  assertMsg91Success(raw, message);
  return raw;
}

export async function msg91SendOtp(phoneInput: string): Promise<{ reqId: string }> {
  const phone = toCanonicalIndiaPhone(phoneInput);
  const identifier = toMsg91Identifier(phoneInput);
  if (!phone || !identifier) {
    throw new Error('Enter a valid 10-digit Indian mobile number');
  }

  // Widget APIs authenticate with tokenAuth only.
  const raw = await msg91WidgetPost('/sendOtp', { identifier }, 'token');
  const reqId = extractStringField(raw, ['message', 'reqId']);
  if (!reqId) throw new Error('MSG91 did not return a request id');
  return { reqId };
}

export async function msg91RetryOtp(reqId: string): Promise<void> {
  if (!reqId) throw new Error('Missing OTP request id');
  await msg91WidgetPost(
    '/retryOtp',
    {
      reqId,
      retryChannel: 11, // SMS
    },
    'token'
  );
}

export async function msg91VerifyOtp(
  reqId: string,
  otp: string
): Promise<{ accessToken: string }> {
  if (!reqId) throw new Error('Missing OTP request id');
  const cleaned = String(otp || '').replace(/\D/g, '');
  if (cleaned.length !== 4) throw new Error('Enter the 4-digit OTP');

  const raw = await msg91WidgetPost(
    '/verifyOtp',
    {
      reqId,
      otp: cleaned,
    },
    'token'
  );

  const accessToken = extractStringField(raw, ['message', 'accessToken', 'token']);
  if (!accessToken) throw new Error('MSG91 did not return an access token');
  return { accessToken };
}
