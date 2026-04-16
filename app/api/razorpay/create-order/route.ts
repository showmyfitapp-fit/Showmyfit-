import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { amount, currency = 'INR', receipt: customReceipt } = body;

        console.log('📦 Razorpay create-order request:', { amount, currency, customReceipt });

        // Validate amount
        if (!amount || amount <= 0) {
            console.error('❌ Invalid amount:', amount);
            return NextResponse.json(
                { error: 'Invalid amount. Amount must be greater than 0.' },
                { status: 400 }
            );
        }

        // Razorpay credentials from environment variables
        const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_SEWbFSuaVOCurS';
        const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'QM2QJ9iF7uiAOtRLcEdoR8KQ';

        if (!razorpayKeyId || !razorpayKeySecret) {
            console.error('❌ Razorpay keys missing in environment variables');
            return NextResponse.json(
                { error: 'Payment gateway not configured. Please contact support.' },
                { status: 500 }
            );
        }

        // Calculate amount in paisa (Razorpay requires paisa)
        const amountInPaisa = Math.round(amount * 100);

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
