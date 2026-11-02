import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { amount, currency = 'INR', receipt: customReceipt, items, coupon } = body;

        console.log('📦 Razorpay create-order request:', { amount, currency, customReceipt });

        let chargedAmount = Number(amount);
        if (Array.isArray(items) && items.length) {
          try {
            const ids = items.map((item: { productId?: string }) => item.productId).filter(Boolean);
            if (ids.length) {
              const { getSupabaseAdminClient } = await import('@/lib/supabase/admin-server');
              const { data } = await getSupabaseAdminClient()
                .from('products')
                .select('id, price')
                .in('id', ids);
              if (data?.length) {
                const priceById = new Map(data.map((row) => [String(row.id), Number(row.price || 0)]));
                const catalogTotal = items.reduce((sum: number, item: { productId?: string; quantity?: number }) => {
                  const price = priceById.get(String(item.productId || ''));
                  if (price == null) return sum;
                  return sum + price * Number(item.quantity || 1);
                }, 0);
                if (catalogTotal > 0) chargedAmount = catalogTotal;
              }
            }
          } catch (error) {
            console.warn('Catalog amount lookup skipped:', error);
          }
        }

        if (coupon) {
          const { applyCoupon } = await import('@/lib/ops/rules');
          chargedAmount = applyCoupon(chargedAmount, String(coupon)).amount;
        }

        // Validate amount
        if (!chargedAmount || chargedAmount <= 0) {
            console.error('❌ Invalid amount:', amount);
            return NextResponse.json(
                { error: 'Invalid amount. Amount must be greater than 0.' },
                { status: 400 }
            );
        }

        // Razorpay credentials from environment variables
        const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
        const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!razorpayKeyId || !razorpayKeySecret) {
            console.error('❌ Razorpay keys missing in environment variables');
            return NextResponse.json(
                { error: 'Payment gateway not configured. Please contact support.' },
                { status: 500 }
            );
        }

        // Calculate amount in paisa (Razorpay requires paisa)
        const amountInPaisa = Math.round(chargedAmount * 100);

        // Generate receipt ID (max 40 chars)
        const timestamp = Date.now().toString();
        const receipt = customReceipt || `rcpt_smf_${timestamp}`.substring(0, 40);

        const razorpayOrderData = {
            amount: amountInPaisa,
            currency: currency,
            receipt: receipt,
            notes: {
                source: 'showmyfit_web',
                timestamp: new Date().toISOString()
            }
        };

        const auth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');

        console.log('💳 Creating Razorpay order via API:', receipt);

        const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`
            },
            body: JSON.stringify(razorpayOrderData)
        });

        if (!razorpayResponse.ok) {
            let errorData: any;
            try {
                errorData = await razorpayResponse.json();
            } catch {
                errorData = await razorpayResponse.text();
            }
            console.error('❌ Razorpay API Error:', {
                status: razorpayResponse.status,
                error: errorData
            });

            return NextResponse.json(
                {
                    error: errorData?.error?.description || 'Failed to create payment order',
                    details: errorData
                },
                { status: razorpayResponse.status }
            );
        }

        const orderData = await razorpayResponse.json();
        console.log('✅ Razorpay order created successfully:', orderData.id);

        return NextResponse.json({
            id: orderData.id,
            currency: orderData.currency,
            amount: orderData.amount,
            key: razorpayKeyId
        });

    } catch (error: any) {
        console.error('❌ Razorpay order creation failed:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}
