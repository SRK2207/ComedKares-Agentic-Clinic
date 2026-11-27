import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clinicId = searchParams.get('clinicId') || searchParams.get('clinic_id') || 'clinic_alpha';

  const clinic = db.getClinic(clinicId);
  if (!clinic) {
    return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
  }

  const appointments = db.getAppointments(clinic.id);
  const escalations = db.getEscalations(clinic.id);
  const auditLogs = db.getAuditLogs(clinic.id);
  const doctors = db.getDoctors(clinic.id);
  const slots = db.getSlots(clinic.id);

  // Compute metrics
  const activeBookings = appointments.filter(a => a.status === 'BOOKED' && a.payment_status === 'PAID').length;
  const heldSlots = db.slots.filter(s => s.clinic_id === clinic.id && s.status === 'HELD').length;
  const openEscalations = escalations.filter(e => e.status === 'OPEN').length;
  const totalRevenue = appointments
    .filter(a => a.payment_status === 'PAID')
    .reduce((sum, a) => {
      const doc = doctors.find(d => d.id === a.doctor_id);
      return sum + (doc?.consultation_fee_inr || 500);
    }, 0);

  return NextResponse.json({
    clinic,
    metrics: {
      activeBookings,
      heldSlots,
      openEscalations,
      totalRevenue,
      availableSlots: slots.length,
    },
    appointments,
    escalations,
    auditLogs: auditLogs.slice(0, 50),
    doctors,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, clinic_id, escalation_id, appointment_id, doctor_id, is_active } = body;

    const clinic = db.getClinic(clinic_id);
    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    if (action === 'RESOLVE_ESCALATION') {
      const esc = db.escalations.find(e => e.id === escalation_id && e.clinic_id === clinic.id);
      if (esc) {
        esc.status = 'RESOLVED';
        esc.updated_at = new Date().toISOString();
        db.logAudit({
          clinic_id: clinic.id,
          actor_type: 'STAFF',
          actor_id: 'dashboard-user',
          action: 'ESCALATION_RESOLVED',
          entity_type: 'escalation',
          entity_id: esc.id,
          metadata: { reason: esc.reason },
        });
        return NextResponse.json({ success: true, escalation: esc });
      }
      return NextResponse.json({ error: 'Escalation not found' }, { status: 404 });
    }

    if (action === 'TOGGLE_DOCTOR') {
      const doc = db.doctors.find(d => d.id === doctor_id && d.clinic_id === clinic.id);
      if (doc) {
        doc.is_active = Boolean(is_active);
        db.logAudit({
          clinic_id: clinic.id,
          actor_type: 'STAFF',
          actor_id: 'dashboard-user',
          action: 'DOCTOR_AVAILABILITY_CHANGED',
          entity_type: 'doctor',
          entity_id: doc.id,
          metadata: { is_active: doc.is_active, doctor_name: doc.name },
        });
        return NextResponse.json({ success: true, doctor: doc });
      }
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Unsupported staff action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
