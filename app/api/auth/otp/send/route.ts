import { NextRequest, NextResponse } from 'next/server';
import { toCanonicalIndiaPhone } from '@/lib/auth/phone';
import { msg91SendOtp } from '@/lib/msg91/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = toCanonicalIndiaPhone(String(body?.phone || ''));
    if (!phone) {
      return NextResponse.json(
        { error: 'Enter a valid 10-digit Indian mobile number', code: 'invalid_phone' },
        { status: 400 }
      );
    }

    const { reqId } = await msg91SendOtp(phone);
    return NextResponse.json({ reqId, phone });
  } catch (error: unknown) {
    console.error('OTP send error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to send OTP';
    return NextResponse.json({ error: message, code: 'otp_send_failed' }, { status: 500 });
  }
}
