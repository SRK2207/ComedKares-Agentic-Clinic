import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase/db';
import { createRazorpayOrder } from '@/lib/razorpay';

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
    const { clinic_id, appointment_id } = body;

    if (!clinic_id || !appointment_id) {
      return NextResponse.json(
        { error: 'clinic_id and appointment_id are required' },
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

    const appt = db.appointments.find(a => a.id === appointment_id && a.clinic_id === clinic.id);
    if (!appt) {
      return NextResponse.json(
        { error: 'Held appointment not found for this clinic' },
        { status: 404, headers: corsHeaders() }
      );
    }

    const doc = db.doctors.find(d => d.id === appt.doctor_id);
    const amountInr = doc?.consultation_fee_inr || 500;

    const order = await createRazorpayOrder(amountInr, appointment_id, {
      clinic_id: clinic.id,
      appointment_id: appt.id,
      patient_name: appt.patient_name,
    });

    // Update appointment with provisional order ID
    appt.razorpay_order_id = order.orderId;

    db.logAudit({
      clinic_id: clinic.id,
      actor_type: 'AI_AGENT',
      actor_id: appointment_id,
      action: 'PAYMENT_ORDER_CREATED',
      entity_type: 'order',
      entity_id: order.orderId,
      metadata: {
        appointment_id: appt.id,
        amount_paise: order.amount,
      },
    });

    return NextResponse.json(
      {
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        key_id: order.keyId,
        clinic_name: clinic.name,
        doctor_name: doc?.name || 'Doctor',
        appointment_id: appt.id,
      },
      { headers: corsHeaders() }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create payment order' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
