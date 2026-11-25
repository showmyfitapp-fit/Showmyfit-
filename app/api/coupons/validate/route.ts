import { NextRequest, NextResponse } from 'next/server';
import { applyCoupon } from '@/lib/ops/rules';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { code?: string; amount?: number };
    const amount = Number(body.amount || 0);
    const result = applyCoupon(amount, body.code);
    if (result.error || !result.code) {
      return NextResponse.json(
        { ok: false, discount: 0, code: '', error: result.error || 'This coupon code is invalid.' },
        { status: 400 }
      );
    }
    return NextResponse.json({
      ok: true,
      code: result.code,
      discount: result.discount,
      amount: result.amount,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Could not validate coupon' },
      { status: 400 }
    );
  }
}
