import { NextRequest, NextResponse } from 'next/server';
import { quoteCartFromCatalog } from '@/lib/server/checkout-quote';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { currency = 'INR', receipt: customReceipt, items, coupon, paymentMethod } = body;

        if (!Array.isArray(items) || !items.length) {
            return NextResponse.json(
                { error: 'Order items are required so the amount can be calculated from catalog prices' },
                { status: 400 }
            );
        }

        let quote;
        try {
            quote = (await quoteCartFromCatalog(items, coupon, paymentMethod || 'razorpay')).combined;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Could not price this order';
            const status = /out of stock/i.test(message) ? 409 : 400;
            return NextResponse.json({ error: message }, { status });
        }

        if (quote.couponCode === '' && coupon) {
            return NextResponse.json(
                { error: quote.couponError || 'This coupon code is invalid.' },
                { status: 400 }
            );
        }

        const chargedAmount = quote.total;
        if (!chargedAmount || chargedAmount <= 0) {
            return NextResponse.json(
                { error: 'Invalid amount. Amount must be greater than 0.' },
                { status: 400 }
            );
        }

        const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
        const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!razorpayKeyId || !razorpayKeySecret) {
            return NextResponse.json(
                { error: 'Payment gateway not configured. Please contact support.' },
                { status: 500 }
            );
        }

        const amountInPaisa = Math.round(chargedAmount * 100);
        const timestamp = Date.now().toString();
        const receipt = customReceipt || `rcpt_smf_${timestamp}`.substring(0, 40);

        const razorpayOrderData = {
            amount: amountInPaisa,
            currency: currency,
            receipt: receipt,
            notes: {
                source: 'showmyfit_web',
                coupon: quote.couponCode || '',
                timestamp: new Date().toISOString(),
            },
        };

        const auth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');
        const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${auth}`,
            },
            body: JSON.stringify(razorpayOrderData),
        });

        if (!razorpayResponse.ok) {
            let errorData: any;
            try {
                errorData = await razorpayResponse.json();
            } catch {
                errorData = await razorpayResponse.text();
            }
            return NextResponse.json(
                {
                    error: errorData?.error?.description || 'Failed to create payment order',
                    details: errorData,
                },
                { status: razorpayResponse.status }
            );
        }

        const orderData = await razorpayResponse.json();
        return NextResponse.json({
            id: orderData.id,
            currency: orderData.currency,
            amount: orderData.amount,
            key: razorpayKeyId,
            quote,
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}
