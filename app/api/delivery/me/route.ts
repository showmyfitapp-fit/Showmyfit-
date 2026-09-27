import { NextRequest, NextResponse } from 'next/server';
import { findDeliveryPartner, setPartnerOnline } from '@/lib/server/delivery-partners';
import { getRequestUser, isAdminEmail } from '@/lib/server/request-user';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    }
    const partner = await findDeliveryPartner(user.id, user.email);
    return NextResponse.json({ partner });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not load delivery partner' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    }
    const body = (await request.json()) as { isOnline?: boolean };
    if (typeof body.isOnline !== 'boolean') {
      return NextResponse.json({ error: 'isOnline is required' }, { status: 400 });
    }
    const partner = await setPartnerOnline(user.id, body.isOnline, {
      email: user.email,
      name: user.user_metadata?.full_name || user.email || 'Delivery partner',
      createIfMissing: await isAdminEmail(user.email),
    });
    return NextResponse.json({ partner });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update online status';
    const status = message.includes('not enabled') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
