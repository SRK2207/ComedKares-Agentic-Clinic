export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type LanguageCode = 'en' | 'hi' | 'kn';

export interface Clinic {
  id: string;
  slug: string;
  name: string;
  theme_color: string;
  supported_languages: LanguageCode[];
  booking_policy?: string | null;
  emergency_contact?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ClinicStaff {
  id: string;
  user_id: string;
  clinic_id: string;
  full_name: string;
  role: 'ADMIN' | 'RECEPTIONIST';
  created_at?: string;
}

export interface Department {
  id: string;
  clinic_id: string;
  name: string;
  description?: string | null;
  created_at?: string;
}

export interface Doctor {
  id: string;
  clinic_id: string;
  department_id: string;
  name: string;
  qualification: string;
  consultation_fee_inr: number;
  languages: LanguageCode[];
  is_active: boolean;
  created_at?: string;
  department_name?: string;
}

export type SlotStatus = 'AVAILABLE' | 'HELD' | 'CONFIRMED' | 'BLOCKED';

export interface Slot {
  id: string;
  clinic_id: string;
  doctor_id: string;
  start_time: string;
  end_time: string;
  status: SlotStatus;
  hold_expires_at?: string | null;
  held_by_session_id?: string | null;
  doctor_name?: string;
  department_name?: string;
  fee?: number;
}

export interface Appointment {
  id: string;
  clinic_id: string;
  slot_id: string;
  doctor_id: string;
  patient_name: string;
  patient_phone: string;
  patient_age?: number | null;
  symptoms_summary?: string | null;
  preferred_language: LanguageCode;
  consent_granted: boolean;
  otp_verified: boolean;
  payment_status: 'PENDING' | 'PAID' | 'REFUNDED';
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  status: 'BOOKED' | 'CANCELLED' | 'RESCHEDULED' | 'COMPLETED';
  created_at: string;
  updated_at?: string;
  slot_time?: string;
  doctor_name?: string;
}

export interface WaitlistEntry {
  id: string;
  clinic_id: string;
  doctor_id: string;
  preferred_date: string;
  patient_name: string;
  patient_phone: string;
  status: 'WAITING' | 'NOTIFIED' | 'BOOKED';
  created_at: string;
  doctor_name?: string;
}

export interface Escalation {
  id: string;
  clinic_id: string;
  session_id: string;
  patient_phone?: string | null;
  reason: string;
  severity: 'ROUTINE' | 'EMERGENCY';
  transcript_summary?: string | null;
  status: 'OPEN' | 'RESOLVED';
  created_at: string;
  updated_at?: string;
}

export interface AuditLog {
  id: string;
  clinic_id: string;
  actor_type: 'AI_AGENT' | 'PATIENT' | 'STAFF' | 'SYSTEM_WEBHOOK';
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, any>;
  created_at: string;
}
