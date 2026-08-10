import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Server-side MSG91 send is disabled for this widget.
 * The widget is India-only; Vercel/server IPs get MSG91 "Invalid Request".
 * OTP send/verify runs in the browser via the MSG91 widget SDK.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        'OTP send must run in the browser (MSG91 India-only widget). Refresh /login and use Login with OTP — do not call /api/auth/otp/send from the server.',
      code: 'use_browser_widget',
    },
    { status: 400 }
  );
}
