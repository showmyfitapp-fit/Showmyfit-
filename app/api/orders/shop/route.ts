import { NextRequest, NextResponse } from 'next/server';
import { findByIdOrAuthUserId, getRequestUser } from '@/lib/server/request-user';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

    const sellerId = request.nextUrl.searchParams.get('sellerId') || '';
    if (!sellerId) return NextResponse.json({ error: 'sellerId required' }, { status: 400 });

    const profile = await findByIdOrAuthUserId('profiles', sellerId);
    if (!profile) {
      return NextResponse.json({
        seller: { sellerId, sellerName: 'Store' },
      });
    }

    const raw = (profile.raw || {}) as Record<string, any>;
    const location = (raw.location || profile.location) as
      | { lat?: number; lng?: number; address?: string }
      | undefined;

    return NextResponse.json({
      seller: {
        sellerId,
        sellerName: raw.businessName || profile.display_name || raw.displayName || 'Store',
        storeAddress:
          profile.address || raw.address || raw.businessAddress || location?.address,
        storePhone: profile.phone || raw.phone,
        storeLocation:
          location?.lat && location?.lng
            ? {
                lat: location.lat,
                lng: location.lng,
                address: location.address || profile.address || raw.address || '',
              }
            : null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not load shop' },
      { status: 500 }
    );
  }
}
