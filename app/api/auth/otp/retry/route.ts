import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Resend also must use the browser MSG91 widget (India IP). */
export async function POST() {
  return NextResponse.json(
    {
      error:
        'OTP resend must run in the browser MSG91 widget. Use the Resend OTP button on /login.',
      code: 'use_browser_widget',
    },
    { status: 400 }
  );
}
