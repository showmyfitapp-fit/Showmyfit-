'use client';

import { toMsg91Identifier } from '@/lib/auth/phone';

const MSG91_SCRIPT_SRC = 'https://verify.msg91.com/otp-provider.js';
const METHOD_WAIT_MS = 8000;
const REQUEST_TIMEOUT_MS = 20000;

type Msg91CallbackData = {
  message?: string | { reqId?: string };
  type?: string;
  reqId?: string;
  [key: string]: unknown;
};

type WindowWithMsg91 = Window & {
  initSendOTP?: (config: Record<string, unknown>) => void;
  sendOtp?: (
    identifier: string,
    success?: (data: Msg91CallbackData) => void,
    failure?: (error: unknown) => void
  ) => void;
  retryOtp?: (
    channel: string | null,
    success?: (data: Msg91CallbackData) => void,
    failure?: (error: unknown) => void,
    reqId?: string
  ) => void;
  verifyOtp?: (
    otp: string | number,
    success?: (data: Msg91CallbackData) => void,
    failure?: (error: unknown) => void,
    reqId?: string
  ) => void;
};

let initPromise: Promise<void> | null = null;

function getWindow(): WindowWithMsg91 {
  return window as WindowWithMsg91;
}

function extractMessage(data: Msg91CallbackData | unknown): string {
  if (!data) return '';
  if (typeof data === 'string') return data;
  if (typeof data !== 'object') return String(data);

  const record = data as Msg91CallbackData;
  if (typeof record.reqId === 'string' && record.reqId) return record.reqId;
  if (typeof record.message === 'string' && record.message) return record.message;
  if (
    record.message &&
    typeof record.message === 'object' &&
    typeof record.message.reqId === 'string'
  ) {
    return record.message.reqId;
  }
  return '';
}

function rejectWithMsg91Error(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === 'string') return new Error(error);
  if (error && typeof error === 'object') {
    const record = error as {
      message?: string | { message?: string };
      error?: string;
      msg?: string;
    };
    if (typeof record.message === 'string' && record.message) {
      return new Error(record.message);
    }
    if (
      record.message &&
      typeof record.message === 'object' &&
      typeof record.message.message === 'string'
    ) {
      return new Error(record.message.message);
    }
    return new Error(record.error || record.msg || 'MSG91 request failed');
  }
  return new Error('MSG91 request failed');
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  timeoutMessage: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(timeoutMessage)), ms);
    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

function waitForMethod(
  name: 'sendOtp' | 'retryOtp' | 'verifyOtp',
  timeoutMs = METHOD_WAIT_MS
): Promise<void> {
  const w = getWindow();
  if (typeof w[name] === 'function') return Promise.resolve();

  return new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (typeof getWindow()[name] === 'function') {
        window.clearInterval(timer);
        resolve();
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        window.clearInterval(timer);
        reject(
          new Error(
            'MSG91 OTP widget did not finish loading. Disable Captcha in the MSG91 widget settings, then refresh and try again.'
          )
        );
      }
    }, 50);
  });
}

function loadMsg91Script(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('MSG91 widget is only available in the browser'));
  }

  const w = getWindow();
  if (w.initSendOTP) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${MSG91_SCRIPT_SRC}"]`
  );
  if (existing) {
    return new Promise((resolve, reject) => {
      if (w.initSendOTP) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('Failed to load MSG91 OTP script')),
        { once: true }
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = MSG91_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load MSG91 OTP script'));
    document.body.appendChild(script);
  });
}

export async function initMsg91OtpWidget(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const widgetId = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID;
    const tokenAuth = process.env.NEXT_PUBLIC_MSG91_AUTH_TOKEN;

    if (!widgetId || !tokenAuth) {
      throw new Error(
        'Missing NEXT_PUBLIC_MSG91_WIDGET_ID or NEXT_PUBLIC_MSG91_AUTH_TOKEN in .env.local'
      );
    }

    await loadMsg91Script();

    const w = getWindow();
    if (!w.initSendOTP) {
      throw new Error('MSG91 initSendOTP is unavailable');
    }

    w.initSendOTP({
      widgetId,
      tokenAuth,
      exposeMethods: true,
      success: () => undefined,
      failure: () => undefined,
    });

    await waitForMethod('sendOtp');
  })().catch((error) => {
    initPromise = null;
    throw error;
  });

  return initPromise;
}

export async function sendOtp(phoneInput: string): Promise<{ reqId: string }> {
  await initMsg91OtpWidget();
  await waitForMethod('sendOtp');

  const identifier = toMsg91Identifier(phoneInput);
  if (!identifier) {
    throw new Error('Enter a valid 10-digit Indian mobile number');
  }

  const w = getWindow();
  if (!w.sendOtp) throw new Error('MSG91 sendOtp is unavailable');

  const request = new Promise<{ reqId: string }>((resolve, reject) => {
    w.sendOtp?.(
      identifier,
      (data) => {
        const reqId = extractMessage(data);
        if (!reqId) {
          reject(new Error('MSG91 did not return a request id'));
          return;
        }
        resolve({ reqId });
      },
      (error) => reject(rejectWithMsg91Error(error))
    );
  });

  return withTimeout(
    request,
    REQUEST_TIMEOUT_MS,
    'OTP request timed out. In MSG91 widget settings, turn Captcha OFF, save, refresh this page, and try again.'
  );
}

export async function retryOtp(reqId: string): Promise<void> {
  await initMsg91OtpWidget();
  await waitForMethod('retryOtp');

  const w = getWindow();
  if (!w.retryOtp) throw new Error('MSG91 retryOtp is unavailable');

  const request = new Promise<void>((resolve, reject) => {
    w.retryOtp?.(
      null,
      () => resolve(),
      (error) => reject(rejectWithMsg91Error(error)),
      reqId
    );
  });

  return withTimeout(
    request,
    REQUEST_TIMEOUT_MS,
    'Resend OTP timed out. Disable Captcha in MSG91 widget settings and try again.'
  );
}

export async function verifyOtp(
  reqId: string,
  otp: string
): Promise<{ accessToken: string }> {
  await initMsg91OtpWidget();
  await waitForMethod('verifyOtp');

  const w = getWindow();
  if (!w.verifyOtp) throw new Error('MSG91 verifyOtp is unavailable');

  const cleaned = otp.replace(/\D/g, '');
  if (cleaned.length !== 4) {
    throw new Error('Enter the 4-digit OTP');
  }

  const request = new Promise<{ accessToken: string }>((resolve, reject) => {
    w.verifyOtp?.(
      cleaned,
      (data) => {
        const accessToken = extractMessage(data);
        if (!accessToken) {
          reject(new Error('MSG91 did not return an access token'));
          return;
        }
        resolve({ accessToken });
      },
      (error) => reject(rejectWithMsg91Error(error)),
      reqId
    );
  });

  return withTimeout(
    request,
    REQUEST_TIMEOUT_MS,
    'OTP verification timed out. Please try again.'
  );
}
