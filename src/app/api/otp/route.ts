import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase/db';
import { sendOtpViaMsg91 } from '@/lib/sms';

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
    const { action, clinic_id, phone_number, otp_code } = body;

    if (!clinic_id || !phone_number) {
      return NextResponse.json(
        { error: 'clinic_id and phone_number are required' },
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

    if (action === 'send') {
      const { code, demoHint } = db.createOtp(clinic.id, phone_number);

      // Asynchronously trigger real SMS if MSG91 keys are set
      await sendOtpViaMsg91(phone_number, code).catch(() => {});

      const hasRealSms = Boolean(process.env.MSG91_AUTH_KEY);
      return NextResponse.json(
        {
          success: true,
          status: 'OTP_SENT',
          phone_number,
          demo_otp_hint: hasRealSms ? undefined : demoHint,
          message: hasRealSms
            ? `6-digit verification code sent to +91 ${phone_number} via SMS.`
            : '6-digit verification code sent to patient mobile.',
        },
        { headers: corsHeaders() }
      );
    }

    if (action === 'verify') {
      if (!otp_code) {
        return NextResponse.json(
          { error: 'otp_code is required for verification' },
          { status: 400, headers: corsHeaders() }
        );
      }

      const verified = db.verifyOtp(clinic.id, phone_number, otp_code);
      return NextResponse.json(
        {
          success: verified,
          verified,
          phone_number,
          message: verified ? 'Phone number verified successfully' : 'Invalid or expired OTP code',
        },
        { headers: corsHeaders() }
      );
    }

    return NextResponse.json(
      { error: 'Invalid action. Expected "send" or "verify"' },
      { status: 400, headers: corsHeaders() }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'OTP processing failed' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
