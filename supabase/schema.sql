-- ==============================================================================
-- ComedKares Multi-Tenant Database Schema
-- Multi-Clinic Healthcare Receptionist Platform
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Clinics (Tenant Master Table)
CREATE TABLE IF NOT EXISTS clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    theme_color TEXT NOT NULL DEFAULT '#4f46e5',
    supported_languages TEXT[] NOT NULL DEFAULT ARRAY['en', 'hi', 'kn'],
    booking_policy TEXT,
    emergency_contact TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Clinic Staff (Multi-Tenant Staff Auth Mapping)
CREATE TABLE IF NOT EXISTS clinic_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- references auth.users(id) in Supabase Auth
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'RECEPTIONIST')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Departments
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Doctors
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    qualification TEXT,
    consultation_fee_inr NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
    languages TEXT[] NOT NULL DEFAULT ARRAY['en', 'hi', 'kn'],
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Appointment Slots
CREATE TABLE IF NOT EXISTS slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'HELD', 'CONFIRMED', 'BLOCKED')),
    hold_expires_at TIMESTAMPTZ,
    held_by_session_id TEXT,
    CONSTRAINT valid_slot_times CHECK (end_time > start_time)
);

-- 6. Patient OTP Verifications
CREATE TABLE IF NOT EXISTS otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Appointments
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    slot_id UUID UNIQUE NOT NULL REFERENCES slots(id) ON DELETE RESTRICT,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    patient_age INT CHECK (patient_age >= 0 AND patient_age <= 130),
    symptoms_summary TEXT,
    preferred_language TEXT NOT NULL DEFAULT 'en',
    consent_granted BOOLEAN NOT NULL DEFAULT false,
    otp_verified BOOLEAN NOT NULL DEFAULT false,
    payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'REFUNDED')),
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    status TEXT NOT NULL DEFAULT 'BOOKED' CHECK (status IN ('BOOKED', 'CANCELLED', 'RESCHEDULED', 'COMPLETED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Waitlist
CREATE TABLE IF NOT EXISTS waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    preferred_date DATE NOT NULL,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'NOTIFIED', 'BOOKED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Escalations
CREATE TABLE IF NOT EXISTS escalations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    patient_phone TEXT,
    reason TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('ROUTINE', 'EMERGENCY')),
    transcript_summary TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Immutable Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    actor_type TEXT NOT NULL CHECK (actor_type IN ('AI_AGENT', 'PATIENT', 'STAFF', 'SYSTEM_WEBHOOK')),
    actor_id TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE AND ATOMIC LOCKS
-- ==============================================================================

-- Critical index for atomic slot locking query:
-- WHERE id = $slot_id AND clinic_id = $clinic_id AND (status = 'AVAILABLE' OR (status = 'HELD' AND hold_expires_at < NOW()))
CREATE INDEX IF NOT EXISTS idx_slots_locking ON slots (clinic_id, status, hold_expires_at);
CREATE INDEX IF NOT EXISTS idx_slots_doctor_times ON slots (doctor_id, start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_date ON appointments (clinic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_escalations_clinic_status ON escalations (clinic_id, status, severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_clinic_time ON audit_logs (clinic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_lookup ON otp_verifications (clinic_id, phone_number, expires_at);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Public read for active clinics
CREATE POLICY "Public clinics are viewable" ON clinics
    FOR SELECT USING (is_active = true);

-- Public read for departments and doctors
CREATE POLICY "Public departments are viewable" ON departments
    FOR SELECT USING (true);

CREATE POLICY "Public active doctors are viewable" ON doctors
    FOR SELECT USING (is_active = true);

-- Public read for available slots
CREATE POLICY "Public slots are viewable" ON slots
    FOR SELECT USING (true);

-- Staff Policies (Scoped strictly to staff's clinic_id)
CREATE POLICY "Staff can view their clinic data" ON clinics
    FOR ALL USING (
        id IN (SELECT clinic_id FROM clinic_staff WHERE user_id = auth.uid())
    );

CREATE POLICY "Staff can manage departments" ON departments
    FOR ALL USING (
        clinic_id IN (SELECT clinic_id FROM clinic_staff WHERE user_id = auth.uid())
    );

CREATE POLICY "Staff can manage doctors" ON doctors
    FOR ALL USING (
        clinic_id IN (SELECT clinic_id FROM clinic_staff WHERE user_id = auth.uid())
    );

CREATE POLICY "Staff can manage slots" ON slots
    FOR ALL USING (
        clinic_id IN (SELECT clinic_id FROM clinic_staff WHERE user_id = auth.uid())
    );

CREATE POLICY "Staff can view appointments" ON appointments
    FOR ALL USING (
        clinic_id IN (SELECT clinic_id FROM clinic_staff WHERE user_id = auth.uid())
    );

CREATE POLICY "Staff can view waitlist" ON waitlist
    FOR ALL USING (
        clinic_id IN (SELECT clinic_id FROM clinic_staff WHERE user_id = auth.uid())
    );

CREATE POLICY "Staff can manage escalations" ON escalations
    FOR ALL USING (
        clinic_id IN (SELECT clinic_id FROM clinic_staff WHERE user_id = auth.uid())
    );

CREATE POLICY "Staff can view audit logs" ON audit_logs
    FOR SELECT USING (
        clinic_id IN (SELECT clinic_id FROM clinic_staff WHERE user_id = auth.uid())
    );
