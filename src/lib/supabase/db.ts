import { 
  Clinic, 
  Department, 
  Doctor, 
  Slot, 
  Appointment, 
  Escalation, 
  WaitlistEntry, 
  AuditLog, 
  LanguageCode 
} from './types';
import { getSupabaseServerClient } from './server';

// ==============================================================================
// INITIAL SEED DATA FOR CLINIC ALPHA & CLINIC BETA
// ==============================================================================

const SEED_CLINICS: Clinic[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    slug: 'clinic_alpha',
    name: 'Sparsh Dental & Maxillofacial Clinic',
    theme_color: '#4f46e5',
    supported_languages: ['en', 'hi', 'kn'],
    booking_policy: 'Please arrive 10 minutes prior to appointment time. Cancellations free up to 2 hours prior.',
    emergency_contact: '+91 80 2345 6789',
    is_active: true,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    slug: 'clinic_beta',
    name: 'Sahyadri Ortho & Spine Center',
    theme_color: '#059669',
    supported_languages: ['en', 'hi', 'kn'],
    booking_policy: 'Please bring recent X-rays or MRI reports if available. Consultations include gait analysis.',
    emergency_contact: '+91 80 8765 4321',
    is_active: true,
  },
];

const SEED_DEPARTMENTS: Department[] = [
  // Clinic Alpha
  {
    id: 'a2222222-0000-0000-0000-000000000001',
    clinic_id: 'a0000000-0000-0000-0000-000000000001',
    name: 'General Dentistry & Hygiene',
    description: 'Routine checkups, cleanings, tooth cavity fillings, and preventive dental care.',
  },
  {
    id: 'a2222222-0000-0000-0000-000000000002',
    clinic_id: 'a0000000-0000-0000-0000-000000000001',
    name: 'Orthodontics & Braces',
    description: 'Teeth alignment, metal braces, ceramic braces, and clear aligners.',
  },
  {
    id: 'a2222222-0000-0000-0000-000000000003',
    clinic_id: 'a0000000-0000-0000-0000-000000000001',
    name: 'Oral & Maxillofacial Surgery',
    description: 'Wisdom teeth extraction, dental implants, jaw alignment, and trauma management.',
  },
  // Clinic Beta
  {
    id: 'b2222222-0000-0000-0000-000000000001',
    clinic_id: 'b0000000-0000-0000-0000-000000000002',
    name: 'Joint Replacement & Arthroscopy',
    description: 'Knee and hip replacement, arthroscopic repairs, cartilage treatments.',
  },
  {
    id: 'b2222222-0000-0000-0000-000000000002',
    clinic_id: 'b0000000-0000-0000-0000-000000000002',
    name: 'Spine Surgery & Scoliosis',
    description: 'Herniated disc management, sciatica treatment, spinal decompression, endoscopic spine surgery.',
  },
  {
    id: 'b2222222-0000-0000-0000-000000000003',
    clinic_id: 'b0000000-0000-0000-0000-000000000002',
    name: 'Sports Medicine & Physical Rehabilitation',
    description: 'Ligament tear recovery (ACL/PCL), tennis elbow, rotator cuff therapies.',
  },
];

const SEED_DOCTORS: Doctor[] = [
  // Clinic Alpha Doctors
  {
    id: 'a3333333-0000-0000-0000-000000000001',
    clinic_id: 'a0000000-0000-0000-0000-000000000001',
    department_id: 'a2222222-0000-0000-0000-000000000001',
    name: 'Dr. Priya Sharma',
    qualification: 'BDS, MDS (Conservative Dentistry)',
    consultation_fee_inr: 500,
    languages: ['en', 'hi', 'kn'],
    is_active: true,
  },
  {
    id: 'a3333333-0000-0000-0000-000000000002',
    clinic_id: 'a0000000-0000-0000-0000-000000000001',
    department_id: 'a2222222-0000-0000-0000-000000000002',
    name: 'Dr. Vikram Kulkarni',
    qualification: 'BDS, MDS (Orthodontics & Dentofacial Orthopedics)',
    consultation_fee_inr: 700,
    languages: ['en', 'hi', 'kn'],
    is_active: true,
  },
  {
    id: 'a3333333-0000-0000-0000-000000000003',
    clinic_id: 'a0000000-0000-0000-0000-000000000001',
    department_id: 'a2222222-0000-0000-0000-000000000003',
    name: 'Dr. Sandeep Narayan',
    qualification: 'BDS, MDS, FIBOMS (Maxillofacial Surgery)',
    consultation_fee_inr: 900,
    languages: ['en', 'kn'],
    is_active: true,
  },
  // Clinic Beta Doctors
  {
    id: 'b3333333-0000-0000-0000-000000000001',
    clinic_id: 'b0000000-0000-0000-0000-000000000002',
    department_id: 'b2222222-0000-0000-0000-000000000001',
    name: 'Dr. Rajeshwar Rao',
    qualification: 'MBBS, MS (Ortho), MCh (Joint Reconstruction)',
    consultation_fee_inr: 800,
    languages: ['en', 'hi', 'kn'],
    is_active: true,
  },
  {
    id: 'b3333333-0000-0000-0000-000000000002',
    clinic_id: 'b0000000-0000-0000-0000-000000000002',
    department_id: 'b2222222-0000-0000-0000-000000000002',
    name: 'Dr. Ananya Deshmukh',
    qualification: 'MBBS, MS (Ortho), FNB (Spine Surgery)',
    consultation_fee_inr: 1000,
    languages: ['en', 'hi', 'kn'],
    is_active: true,
  },
  {
    id: 'b3333333-0000-0000-0000-000000000003',
    clinic_id: 'b0000000-0000-0000-0000-000000000002',
    department_id: 'b2222222-0000-0000-0000-000000000003',
    name: 'Dr. Harish Gowda',
    qualification: 'MBBS, D.Ortho, Fellowship in Sports Medicine',
    consultation_fee_inr: 650,
    languages: ['en', 'kn'],
    is_active: true,
  },
];

// Generate 7-day rolling slots
function generateInitialSlots(): Slot[] {
  const slots: Slot[] = [];
  const slotSchedules = [
    { hour: 10, minute: 0 },
    { hour: 11, minute: 15 },
    { hour: 12, minute: 30 },
    { hour: 14, minute: 30 },
    { hour: 15, minute: 45 },
    { hour: 17, minute: 0 },
  ];
  let slotIndex = 1;

  for (let d = 0; d < 7; d++) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + d);

    for (const doc of SEED_DOCTORS) {
      for (const t of slotSchedules) {
        const start = new Date(targetDate);
        start.setHours(t.hour, t.minute, 0, 0);
        const end = new Date(start.getTime() + 30 * 60 * 1000);

        const slotId = `slot-${doc.clinic_id.substring(0, 4)}-${doc.id.substring(0, 4)}-d${d}-h${t.hour}m${t.minute}`;
        slots.push({
          id: slotId,
          clinic_id: doc.clinic_id,
          doctor_id: doc.id,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          status: 'AVAILABLE',
          hold_expires_at: null,
          held_by_session_id: null,
        });
        slotIndex++;
      }
    }
  }
  return slots;
}

// In-Memory Multi-Tenant Store (Singleton State for demo runtime)
class MultiTenantStore {
  clinics: Clinic[] = [...SEED_CLINICS];
  departments: Department[] = [...SEED_DEPARTMENTS];
  doctors: Doctor[] = [...SEED_DOCTORS];
  slots: Slot[] = generateInitialSlots();
  appointments: Appointment[] = [];
  escalations: Escalation[] = [];
  waitlist: WaitlistEntry[] = [];
  auditLogs: AuditLog[] = [];
  otpStore: Map<string, { code: string; expiresAt: number; verified: boolean }> = new Map();

  // Helper to resolve clinic id from slug or id
  resolveClinicId(clinicIdOrSlug: string): string | null {
    const found = this.clinics.find(c => c.id === clinicIdOrSlug || c.slug === clinicIdOrSlug);
    return found ? found.id : null;
  }

  getClinic(clinicIdOrSlug: string): Clinic | null {
    const id = this.resolveClinicId(clinicIdOrSlug);
    if (!id) return null;
    return this.clinics.find(c => c.id === id) || null;
  }

  getDepartments(clinicId: string): Department[] {
    const id = this.resolveClinicId(clinicId);
    if (!id) return [];
    return this.departments.filter(d => d.clinic_id === id);
  }

  getDoctors(clinicId: string, query?: string): Doctor[] {
    const id = this.resolveClinicId(clinicId);
    if (!id) return [];
    const allClinicDocs = this.doctors.filter(d => d.clinic_id === id && d.is_active);
    let docs = allClinicDocs;
    if (query && query.trim()) {
      const q = query.toLowerCase();
      const filtered = docs.filter(d => {
        const dep = this.departments.find(dp => dp.id === d.department_id);
        const depName = dep ? dep.name.toLowerCase() : '';
        const docName = d.name.toLowerCase();
        const qual = d.qualification.toLowerCase();

        if (docName.includes(q) || q.includes(docName)) return true;
        if (depName && (depName.includes(q) || q.includes(depName))) return true;
        if (qual && (qual.includes(q) || q.includes(qual))) return true;

        const tokens = q.split(/\s+/).filter(w => w.length > 2);
        return tokens.some(token =>
          docName.includes(token) || depName.includes(token) || qual.includes(token)
        );
      });

      if (filtered.length > 0) {
        docs = filtered;
      }
    }
    return docs.map(d => {
      const dep = this.departments.find(dp => dp.id === d.department_id);
      return { ...d, department_name: dep?.name || 'General' };
    });
  }

  getSlots(clinicId: string, doctorId?: string, dateStr?: string): Slot[] {
    const id = this.resolveClinicId(clinicId);
    if (!id) return [];

    const now = Date.now();
    // Release any expired held slots first
    for (const slot of this.slots) {
      if (slot.status === 'HELD' && slot.hold_expires_at) {
        if (new Date(slot.hold_expires_at).getTime() < now) {
          slot.status = 'AVAILABLE';
          slot.hold_expires_at = null;
          slot.held_by_session_id = null;
        }
      }
    }

    return this.slots
      .filter(s => {
        if (s.clinic_id !== id) return false;
        if (s.status !== 'AVAILABLE') return false;
        if (doctorId && s.doctor_id !== doctorId) return false;
        if (dateStr) {
          const slotDate = s.start_time.split('T')[0];
          if (slotDate !== dateStr) return false;
        }
        return true;
      })
      .map(s => {
        const doc = this.doctors.find(d => d.id === s.doctor_id);
        const dep = doc ? this.departments.find(dp => dp.id === doc.department_id) : null;
        return {
          ...s,
          doctor_name: doc?.name || 'Doctor',
          department_name: dep?.name || 'Specialty',
          fee: doc?.consultation_fee_inr || 500,
        };
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }

  // Atomic 5-Minute Slot Lock
  atomicHoldSlot(
    clinicId: string,
    slotId: string,
    sessionId: string,
    patientInfo: {
      name: string;
      phone: string;
      age?: number;
      symptoms?: string;
      language?: LanguageCode;
      consent: boolean;
    }
  ): { success: boolean; slot?: Slot; appointment?: Appointment; error?: string } {
    const id = this.resolveClinicId(clinicId);
    if (!id) return { success: false, error: 'Clinic not found' };

    const now = Date.now();
    const slot = this.slots.find(s => s.id === slotId && s.clinic_id === id);
    if (!slot) {
      return { success: false, error: 'Slot not found for this clinic' };
    }

    // Atomic conditional check:
    // (status = 'AVAILABLE' OR (status = 'HELD' AND hold_expires_at < NOW()))
    const isExpiredHeld = slot.status === 'HELD' && slot.hold_expires_at && new Date(slot.hold_expires_at).getTime() < now;
    if (slot.status !== 'AVAILABLE' && !isExpiredHeld) {
      return { success: false, error: 'Slot is already booked or held by another patient' };
    }

    // Lock for 5 minutes
    const holdDurationMs = 5 * 60 * 1000;
    const expiresAt = new Date(now + holdDurationMs).toISOString();
    slot.status = 'HELD';
    slot.hold_expires_at = expiresAt;
    slot.held_by_session_id = sessionId;

    // Create provisional appointment
    const apptId = `appt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const appointment: Appointment = {
      id: apptId,
      clinic_id: id,
      slot_id: slot.id,
      doctor_id: slot.doctor_id,
      patient_name: patientInfo.name,
      patient_phone: patientInfo.phone,
      patient_age: patientInfo.age || null,
      symptoms_summary: patientInfo.symptoms || null,
      preferred_language: patientInfo.language || 'en',
      consent_granted: patientInfo.consent,
      otp_verified: true,
      payment_status: 'PENDING',
      razorpay_order_id: null,
      razorpay_payment_id: null,
      status: 'BOOKED',
      created_at: new Date().toISOString(),
      slot_time: slot.start_time,
      doctor_name: this.doctors.find(d => d.id === slot.doctor_id)?.name,
    };

    // Remove any previous appointment linked to this slot
    this.appointments = this.appointments.filter(a => a.slot_id !== slot.id);
    this.appointments.push(appointment);

    // Audit Log
    this.logAudit({
      clinic_id: id,
      actor_type: 'AI_AGENT',
      actor_id: sessionId,
      action: 'SLOT_HOLD_5MIN',
      entity_type: 'slot',
      entity_id: slot.id,
      metadata: {
        appointment_id: apptId,
        patient_name: patientInfo.name,
        expires_at: expiresAt,
      },
    });

    return { success: true, slot, appointment };
  }

  // OTP Handling (4-digit code matching MSG91 default)
  createOtp(clinicId: string, phone: string): { code: string; demoHint: string } {
    const id = this.resolveClinicId(clinicId);
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const key = `${id}_${phone}`;
    this.otpStore.set(key, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,
      verified: false,
    });

    if (id) {
      this.logAudit({
        clinic_id: id,
        actor_type: 'AI_AGENT',
        actor_id: phone,
        action: 'OTP_SENT',
        entity_type: 'otp',
        entity_id: phone,
        metadata: { demo_otp_hint: code },
      });
    }

    return { code, demoHint: code };
  }

  verifyOtp(clinicId: string, phone: string, code: string): boolean {
    const cleanCode = (code || '').trim();
    const id = this.resolveClinicId(clinicId);
    const key = `${id}_${phone}`;
    const record = this.otpStore.get(key);

    // Any 4-digit code is accepted as verified (as requested: if no SMS received, accept any 4-digit input)
    const isFourDigit = /^\d{4}$/.test(cleanCode);
    const isSixDigit = /^\d{6}$/.test(cleanCode);
    const isUniversalDemo = cleanCode === '1234' || cleanCode === '123456';

    if (record && (record.code === cleanCode || isFourDigit || isSixDigit || isUniversalDemo) && record.expiresAt > Date.now()) {
      record.verified = true;
      if (id) {
        this.logAudit({
          clinic_id: id,
          actor_type: 'PATIENT',
          actor_id: phone,
          action: 'OTP_VERIFIED',
          entity_type: 'otp',
          entity_id: phone,
          metadata: { verified: true, code: cleanCode },
        });
      }
      return true;
    }

    // Fallback: accept any 4-digit or standard demo code to ensure user never gets blocked
    if (isFourDigit || isSixDigit || isUniversalDemo) {
      if (id) {
        this.logAudit({
          clinic_id: id,
          actor_type: 'PATIENT',
          actor_id: phone,
          action: 'OTP_VERIFIED_FALLBACK',
          entity_type: 'otp',
          entity_id: phone,
          metadata: { verified: true, code: cleanCode },
        });
      }
      return true;
    }
    return false;
  }

  // Confirm Payment & Finalize Appointment
  confirmPayment(
    clinicId: string,
    appointmentId: string,
    orderId: string,
    paymentId: string
  ): { success: boolean; appointment?: Appointment; error?: string } {
    const id = this.resolveClinicId(clinicId);
    const appt = this.appointments.find(a => a.id === appointmentId && (id ? a.clinic_id === id : true));
    if (!appt) {
      return { success: false, error: 'Appointment not found' };
    }

    appt.payment_status = 'PAID';
    appt.razorpay_order_id = orderId;
    appt.razorpay_payment_id = paymentId;
    appt.status = 'BOOKED';

    const slot = this.slots.find(s => s.id === appt.slot_id);
    if (slot) {
      slot.status = 'CONFIRMED';
      slot.hold_expires_at = null;
    }

    if (id) {
      this.logAudit({
        clinic_id: id,
        actor_type: 'SYSTEM_WEBHOOK',
        actor_id: paymentId,
        action: 'PAYMENT_CONFIRMED',
        entity_type: 'appointment',
        entity_id: appt.id,
        metadata: { orderId, paymentId, slot_id: appt.slot_id },
      });
    }

    return { success: true, appointment: appt };
  }

  // Manage Existing Appointment (Reschedule / Cancel)
  manageAppointment(
    clinicId: string,
    appointmentId: string,
    phone: string,
    action: 'CANCEL' | 'RESCHEDULE',
    newSlotId?: string
  ): { success: boolean; message: string; appointment?: Appointment } {
    const id = this.resolveClinicId(clinicId);
    const appt = this.appointments.find(
      a => a.id === appointmentId && a.patient_phone.endsWith(phone.slice(-10))
    );

    if (!appt) {
      return { success: false, message: 'Appointment not found with matching phone number' };
    }

    if (action === 'CANCEL') {
      appt.status = 'CANCELLED';
      const slot = this.slots.find(s => s.id === appt.slot_id);
      if (slot) {
        slot.status = 'AVAILABLE';
        slot.hold_expires_at = null;
        slot.held_by_session_id = null;
      }

      this.logAudit({
        clinic_id: id || appt.clinic_id,
        actor_type: 'PATIENT',
        actor_id: phone,
        action: 'APPOINTMENT_CANCELLED',
        entity_type: 'appointment',
        entity_id: appt.id,
        metadata: { slot_id: appt.slot_id },
      });

      return { success: true, message: 'Appointment has been cancelled successfully', appointment: appt };
    }

    if (action === 'RESCHEDULE') {
      if (!newSlotId) {
        return { success: false, message: 'New slot ID is required for rescheduling' };
      }
      const newSlot = this.slots.find(s => s.id === newSlotId && s.status === 'AVAILABLE');
      if (!newSlot) {
        return { success: false, message: 'Selected new slot is not available' };
      }

      // Free old slot
      const oldSlot = this.slots.find(s => s.id === appt.slot_id);
      if (oldSlot) {
        oldSlot.status = 'AVAILABLE';
      }

      // Book new slot
      newSlot.status = 'CONFIRMED';
      appt.slot_id = newSlot.id;
      appt.slot_time = newSlot.start_time;
      appt.status = 'RESCHEDULED';

      this.logAudit({
        clinic_id: id || appt.clinic_id,
        actor_type: 'PATIENT',
        actor_id: phone,
        action: 'APPOINTMENT_RESCHEDULED',
        entity_type: 'appointment',
        entity_id: appt.id,
        metadata: { old_slot_id: oldSlot?.id, new_slot_id: newSlot.id },
      });

      return { success: true, message: 'Appointment rescheduled successfully', appointment: appt };
    }

    return { success: false, message: 'Unsupported action' };
  }

  // Join Waitlist
  joinWaitlist(
    clinicId: string,
    doctorId: string,
    preferredDate: string,
    patientName: string,
    patientPhone: string
  ): { success: boolean; entry: WaitlistEntry } {
    const id = this.resolveClinicId(clinicId);
    const entry: WaitlistEntry = {
      id: `wl-${Date.now()}`,
      clinic_id: id || clinicId,
      doctor_id: doctorId,
      preferred_date: preferredDate,
      patient_name: patientName,
      patient_phone: patientPhone,
      status: 'WAITING',
      created_at: new Date().toISOString(),
      doctor_name: this.doctors.find(d => d.id === doctorId)?.name,
    };
    this.waitlist.push(entry);

    if (id) {
      this.logAudit({
        clinic_id: id,
        actor_type: 'PATIENT',
        actor_id: patientPhone,
        action: 'WAITLIST_JOINED',
        entity_type: 'waitlist',
        entity_id: entry.id,
        metadata: { doctor_id: doctorId, preferred_date: preferredDate },
      });
    }

    return { success: true, entry };
  }

  // Escalation (Emergency Red Flag or Routine Handover)
  createEscalation(
    clinicId: string,
    sessionId: string,
    reason: string,
    severity: 'ROUTINE' | 'EMERGENCY',
    transcriptSummary?: string,
    patientPhone?: string
  ): Escalation {
    const id = this.resolveClinicId(clinicId);
    const escalation: Escalation = {
      id: `esc-${Date.now()}`,
      clinic_id: id || clinicId,
      session_id: sessionId,
      patient_phone: patientPhone || null,
      reason,
      severity,
      transcript_summary: transcriptSummary || null,
      status: 'OPEN',
      created_at: new Date().toISOString(),
    };
    this.escalations.unshift(escalation);

    if (id) {
      this.logAudit({
        clinic_id: id,
        actor_type: 'AI_AGENT',
        actor_id: sessionId,
        action: severity === 'EMERGENCY' ? 'EMERGENCY_ESCALATION' : 'ROUTINE_ESCALATION',
        entity_type: 'escalation',
        entity_id: escalation.id,
        metadata: { reason, severity, patient_phone: patientPhone },
      });
    }

    return escalation;
  }

  // Audit Logger
  logAudit(entry: Omit<AuditLog, 'id' | 'created_at'>): AuditLog {
    const log: AuditLog = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    return log;
  }

  getAppointments(clinicId: string): Appointment[] {
    const id = this.resolveClinicId(clinicId);
    if (!id) return [];
    return this.appointments
      .filter(a => a.clinic_id === id)
      .map(a => {
        const slot = this.slots.find(s => s.id === a.slot_id);
        const doc = this.doctors.find(d => d.id === a.doctor_id);
        return {
          ...a,
          slot_time: slot?.start_time || a.slot_time,
          doctor_name: doc?.name || a.doctor_name,
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  getEscalations(clinicId: string): Escalation[] {
    const id = this.resolveClinicId(clinicId);
    if (!id) return [];
    return this.escalations.filter(e => e.clinic_id === id);
  }

  getAuditLogs(clinicId: string): AuditLog[] {
    const id = this.resolveClinicId(clinicId);
    if (!id) return [];
    return this.auditLogs.filter(l => l.clinic_id === id);
  }

  // Clinic onboarding registration
  registerClinic(data: Partial<Clinic> & { name: string; slug: string }): Clinic {
    const newClinic: Clinic = {
      id: `c0000000-0000-0000-0000-${Date.now().toString(16).padStart(12, '0')}`,
      slug: data.slug,
      name: data.name,
      theme_color: data.theme_color || '#4f46e5',
      supported_languages: data.supported_languages || ['en', 'hi', 'kn'],
      booking_policy: data.booking_policy || null,
      emergency_contact: data.emergency_contact || null,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    this.clinics.push(newClinic);

    this.logAudit({
      clinic_id: newClinic.id,
      actor_type: 'STAFF',
      actor_id: 'onboarding-wizard',
      action: 'CLINIC_REGISTERED',
      entity_type: 'clinic',
      entity_id: newClinic.id,
      metadata: { slug: newClinic.slug, name: newClinic.name },
    });

    return newClinic;
  }
}

// Global Singleton to survive hot-reloading in Next.js development
const globalForStore = global as unknown as { multiTenantStore?: MultiTenantStore };
export const db = globalForStore.multiTenantStore ?? new MultiTenantStore();
if (process.env.NODE_ENV !== 'production') globalForStore.multiTenantStore = db;
