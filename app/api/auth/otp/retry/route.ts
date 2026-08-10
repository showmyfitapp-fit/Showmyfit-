import { NextRequest, NextResponse } from 'next/server';
import { msg91RetryOtp } from '@/lib/msg91/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const reqId = String(body?.reqId || '');
    if (!reqId) {
      return NextResponse.json(
        { error: 'Missing OTP request id', code: 'missing_req_id' },
        { status: 400 }
      );
    }

    await msg91RetryOtp(reqId);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error('OTP retry error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to resend OTP';
    return NextResponse.json({ error: message, code: 'otp_retry_failed' }, { status: 500 });
  }
}
