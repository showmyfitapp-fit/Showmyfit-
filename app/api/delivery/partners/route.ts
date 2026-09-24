import { NextRequest, NextResponse } from 'next/server';
import { listDeliveryPartners, upsertDeliveryPartner } from '@/lib/server/delivery-partners';
import { getRequestUser, isAdminEmail } from '@/lib/server/request-user';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    }
    if (!(await isAdminEmail(user.email))) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }
    return NextResponse.json({ partners: await listDeliveryPartners() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not load partners' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    }
    if (!(await isAdminEmail(user.email))) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = (await request.json()) as { userId?: string; name?: string; phone?: string };
    const userId = body.userId?.trim() || user.id;
    await upsertDeliveryPartner({
      userId,
      name: body.name?.trim() || 'Delivery partner',
      phone: body.phone,
      authUserId: userId,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not enable partner' },
      { status: 500 }
    );
  }
}
