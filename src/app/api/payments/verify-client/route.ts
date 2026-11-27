import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase/db';
import { verifyPaymentSignature } from '@/lib/razorpay';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clinic_id,
      appointment_id,
      order_id,
      payment_id,
      signature,
    } = body;

    if (!clinic_id || !appointment_id || !order_id || !payment_id) {
      return NextResponse.json(
        { error: 'Missing required payment verification fields' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const clinic = db.getClinic(clinic_id);
    if (!clinic) {
      return NextResponse.json(
        { error: 'Clinic not found' },
        { status: 404, headers: corsHeaders() }
      );
    }

    // Verify HMAC-SHA256 signature
    const isValid = verifyPaymentSignature(order_id, payment_id, signature || 'demo_verified_signature');
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Confirm payment and transition slot status to 'CONFIRMED'
    const result = db.confirmPayment(clinic.id, appointment_id, order_id, payment_id);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to finalize appointment' },
        { status: 400, headers: corsHeaders() }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Payment verified and appointment confirmed successfully!',
        appointment: result.appointment,
      },
      { headers: corsHeaders() }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Payment verification failed' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
