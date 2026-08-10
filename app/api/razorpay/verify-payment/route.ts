import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderId, paymentId, signature, amount } = body;

        console.log('🔐 Payment verification request:', {
            orderId,
            paymentId,
            signature: signature?.substring(0, 10) + '...'
        });

        // Razorpay credentials from environment variables
        const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_SEWbFSuaVOCurS';
        const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'QM2QJ9iF7uiAOtRLcEdoR8KQ';

        if (!razorpayKeyId || !razorpayKeySecret) {
            console.error('❌ Razorpay keys missing');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        // 1. Verify HMAC Registry Signature
        const text = orderId + "|" + paymentId;
        const hmac = crypto.createHmac('sha256', razorpayKeySecret);
        hmac.update(text);
        const generatedSignature = hmac.digest('hex');

        if (generatedSignature !== signature) {
            console.error('❌ Signature mismatch!');
            return NextResponse.json(
                { verified: false, error: 'Invalid payment signature' },
                { status: 400 }
            );
        }

        console.log('✅ HMAC Signature verified');

        // 2. Secondary Verification: Fetch payment details from Razorpay API
        const auth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');
        const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`
            }
        });

        if (!paymentResponse.ok) {
            const errorText = await paymentResponse.text();
            console.error('❌ Razorpay API Verification failed:', errorText);
            return NextResponse.json(
                { error: 'Failed to verify payment with Razorpay', verified: false },
                { status: 500 }
            );
        }

        const paymentData = await paymentResponse.json();
        console.log('💳 Payment Status:', paymentData.status);

        // Check if payment is captured or authorized
        if (paymentData.status !== 'captured' && paymentData.status !== 'authorized') {
            return NextResponse.json(
                {
                    error: `Payment status is ${paymentData.status}`,
                    verified: false
                },
                { status: 400 }
            );
        }

        // Optional: Verify amount
        if (amount && paymentData.amount !== Math.round(amount * 100)) {
            console.warn(`⚠️ Amount mismatch: Expected ${amount * 100}, Got ${paymentData.amount}`);
        }

        console.log('✅ Payment verified successfully');
        return NextResponse.json({
            verified: true,
            message: 'Payment verified successfully',
            payment: {
                id: paymentData.id,
                status: paymentData.status,
                order_id: paymentData.order_id,
                amount: paymentData.amount
            }
        });

    } catch (error: any) {
        console.error('❌ Payment verification failed:', error);
        return NextResponse.json(
            { error: error.message || 'Verification failed', verified: false },
            { status: 500 }
        );
    }
}
