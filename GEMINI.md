# GEMINI.md — ComedKares Architectural Blueprint

## 1. Project Overview & Zero-Cost Stack
ComedKares is a plug-and-play, multilingual (English, Hindi, Kannada), voice-first Agentic AI Receptionist platform for multi-clinic healthcare appointment management. Clinics register independently, configure doctors, fees, schedules, and policies, and embed a single script tag into their existing website with zero infrastructure changes.

| Layer | Technology Choice | Architectural Role |
| :--- | :--- | :--- |
| **Framework** | Next.js 15 (App Router, TypeScript, Tailwind) | Hosts Staff Dashboard, Onboarding, REST APIs, Webhooks, and Widget bundle. |
| **Database & Auth** | Supabase (PostgreSQL + RLS + Realtime) | Multi-tenant storage, atomic slot locks, live staff alerts, and staff auth. |
| **AI Orchestrator** | @google/genai (gemini-2.5-flash / gemini-2.0-flash) | Native multilingual understanding and deterministic function calling. |
| **Voice Layer** | Browser Web Speech API (STT & TTS) | Zero-latency voice input/output for `en-IN`, `hi-IN`, and `kn-IN`. |
| **Payments** | Razorpay Test Mode + HMAC Webhooks | Checkout modal initiation and backend signature-verified confirmation. |
| **Embed Widget** | Vanilla TypeScript + esbuild | Compiled into `public/widget.js` inside an isolated Shadow DOM root. |

---

## 2. Global Engineering & Multi-Tenant Rules (STRICT)
1. **Strict Tenant Isolation**: Every database table (except `clinics`) MUST include `clinic_id UUID NOT NULL REFERENCES clinics(id)`. Every API query and AI tool execution MUST explicitly filter by `clinic_id`.
2. **No Cross-Clinic Leakage**: Staff Dashboard routes must enforce Supabase Auth session checks mapping `auth.uid()` to `clinic_staff.clinic_id`.
3. **Immutable Audit Logging**: Every state-changing action (slot hold, payment confirmation, cancellation, reschedule, human escalation, manual staff override) MUST insert a record into `audit_logs`.
4. **No Heavy Agent Frameworks**: Do NOT install LangChain or LlamaIndex. Use a clean, deterministic native tool-calling loop with `@google/genai`.
5. **Production-Complete Code**: Keep all generated code strictly typed in TypeScript. Avoid placeholder stubs in critical paths (payment webhooks, slot locks, OTP verification).

---

## 3. Repository Directory Structure
```
/
├── GEMINI.md                     # Architectural rules ingested by all subagents
├── public/
│   ├── widget.js                 # Compiled standalone Shadow DOM widget
│   └── demo/
│       ├── clinic-alpha.html     # Demo Site 1: Sparsh Dental & Maxillofacial Clinic
│       └── clinic-beta.html      # Demo Site 2: Sahyadri Ortho & Spine Center
├── scripts/
│   └── build-widget.mjs          # esbuild script compiling src/widget/index.ts -> public/widget.js
├── src/
│   ├── app/
│   │   ├── (auth)/login/         # Clinic staff authentication
│   │   ├── onboarding/           # Self-service clinic registration & script generator
│   │   ├── dashboard/            # Authenticated staff portal (Appointments, Doctors, Escalations, Logs)
│   │   └── api/
│   │       ├── widget/config/    # GET clinic branding, departments, welcome prompt by clinicId
│   │       ├── agent/chat/       # POST conversational turn + Gemini tool execution loop
│   │       ├── otp/              # POST send & verify patient OTP
│   │       ├── payments/order/   # POST create Razorpay order for a held slot
│   │       ├── payments/verify-client/ # POST fallback HMAC verification for Razorpay payment
│   │       └── webhooks/razorpay/# POST HMAC-SHA256 verified Razorpay webhook
│   ├── lib/
│   │   ├── supabase/             # Server & client Supabase helpers
│   │   ├── gemini/               # System prompts, tool declarations, tool handlers
│   │   └── razorpay.ts           # Razorpay client & signature verification
│   └── widget/
│       ├── index.ts              # Shadow DOM mount, Web Speech API STT/TTS, Razorpay launcher
│       └── styles.css            # Scoped widget styles injected inside ShadowRoot
└── supabase/
    ├── schema.sql                # Full multi-tenant DDL + indexes + RLS policies
    └── seed.sql                  # Seed data for Clinic Alpha & Clinic Beta
```

---

## 4. Multi-Tenant Database Schema (`supabase/schema.sql`)

- **`clinics`**: `id` (UUID PK), `slug` (UNIQUE), `name`, `theme_color`, `supported_languages` (TEXT[]), `booking_policy`, `emergency_contact`, `is_active`, `created_at`
- **`clinic_staff`**: `id` (UUID PK), `user_id` (UUID), `clinic_id` (FK clinics), `full_name`, `role` ('ADMIN' | 'RECEPTIONIST'), `created_at`
- **`departments`**: `id` (UUID PK), `clinic_id` (FK clinics), `name`, `description`, `created_at`
- **`doctors`**: `id` (UUID PK), `clinic_id` (FK clinics), `department_id` (FK), `name`, `qualification`, `consultation_fee_inr`, `languages` (TEXT[]), `is_active`, `created_at`
- **`slots`**: `id` (UUID PK), `clinic_id` (FK), `doctor_id` (FK), `start_time` (TIMESTAMPTZ), `end_time` (TIMESTAMPTZ), `status` ('AVAILABLE' | 'HELD' | 'CONFIRMED' | 'BLOCKED'), `hold_expires_at` (TIMESTAMPTZ), `held_by_session_id` (TEXT)
- **`otp_verifications`**: `id` (UUID PK), `clinic_id` (FK), `phone_number` (TEXT), `otp_code` (TEXT), `verified` (BOOLEAN), `expires_at` (TIMESTAMPTZ), `created_at`
- **`appointments`**: `id` (UUID PK), `clinic_id` (FK), `slot_id` (UNIQUE FK), `doctor_id` (FK), `patient_name`, `patient_phone`, `patient_age`, `symptoms_summary`, `preferred_language`, `consent_granted` (BOOLEAN), `otp_verified` (BOOLEAN), `payment_status` ('PENDING' | 'PAID' | 'REFUNDED'), `razorpay_order_id`, `razorpay_payment_id`, `status` ('BOOKED' | 'CANCELLED' | 'RESCHEDULED' | 'COMPLETED'), `created_at`
- **`waitlist`**: `id` (UUID PK), `clinic_id` (FK), `doctor_id` (FK), `preferred_date` (DATE), `patient_name`, `patient_phone`, `status` ('WAITING' | 'NOTIFIED' | 'BOOKED'), `created_at`
- **`escalations`**: `id` (UUID PK), `clinic_id` (FK), `session_id`, `patient_phone`, `reason`, `severity` ('ROUTINE' | 'EMERGENCY'), `transcript_summary`, `status` ('OPEN' | 'RESOLVED'), `created_at`
- **`audit_logs`**: `id` (UUID PK), `clinic_id` (FK), `actor_type` ('AI_AGENT' | 'PATIENT' | 'STAFF' | 'SYSTEM_WEBHOOK'), `actor_id`, `action`, `entity_type`, `entity_id`, `metadata` (JSONB), `created_at`

---

## 5. Gemini Agent & Tool-Calling Contract

### Language Behavior
Detect the user's language (`en`, `hi`, or `kn`) from their text or voice transcript and respond naturally in the same language, supporting regional medical code-switching.

### Emergency Red-Flag Protocol
If the patient describes severe symptoms (chest pain, heavy bleeding, breathing difficulty, stroke signs, unconsciousness), immediately call `escalate_to_human` with `severity: "EMERGENCY"` and instruct them to seek immediate emergency care.

### Mandatory Booking Sequence
1. Call `search_doctors_and_slots`
2. Collect name, phone, age, and explicit consent
3. Trigger `send_patient_otp` and `verify_patient_otp`
4. Call `hold_appointment_slot` (5-minute lock)
5. Call `initiate_razorpay_payment` to open Razorpay Checkout in the widget.

### Tool Declarations
- `search_doctors_and_slots`: `{ clinic_id, specialty_or_query, date }`
- `send_patient_otp`: `{ clinic_id, phone_number }`
- `verify_patient_otp`: `{ clinic_id, phone_number, otp_code }`
- `hold_appointment_slot`: `{ clinic_id, slot_id, session_id, patient_name, patient_phone, patient_age, symptoms_summary, consent_granted }`
- `initiate_razorpay_payment`: `{ clinic_id, appointment_id }`
- `manage_existing_appointment`: `{ clinic_id, appointment_id, patient_phone, action: "CANCEL" | "RESCHEDULE", new_slot_id? }`
- `join_waitlist`: `{ clinic_id, doctor_id, preferred_date, patient_name, patient_phone }`
- `escalate_to_human`: `{ clinic_id, session_id, reason, severity, transcript_summary, patient_phone? }`

---

## 6. Atomic 5-Minute Slot Hold & Razorpay Verification

### Atomic Slot Locking SQL
```sql
UPDATE slots
SET status = 'HELD', hold_expires_at = NOW() + INTERVAL '5 minutes',
    held_by_session_id = $session_id
WHERE id = $slot_id AND clinic_id = $clinic_id
  AND (status = 'AVAILABLE' OR (status = 'HELD' AND hold_expires_at < NOW()))
RETURNING *;
```

### Webhook & Client Verification
In `/api/webhooks/razorpay`, verify `X-Razorpay-Signature` using HMAC-SHA256 with `RAZORPAY_WEBHOOK_SECRET`. On `payment.captured`, check idempotency, update `appointments.payment_status = 'PAID'` and `slots.status = 'CONFIRMED'`, and write an `audit_logs` entry. Provide a fallback `/api/payments/verify-client` route verifying `order_id + "|" + payment_id` against `RAZORPAY_KEY_SECRET`.

---

## 7. Shadow DOM Embeddable Widget Specification
Clinics integrate the receptionist via a single tag:
```html
<script src="http://localhost:3000/widget.js" data-clinic-id="clinic_alpha" async></script>
```
The script attaches an open ShadowRoot to `#comedkares-widget-root`, provides a language toggle (English | हिंदी | ಕನ್ನಡ) mapped to `en-IN`, `hi-IN`, and `kn-IN` Web Speech APIs, and dynamically loads `https://checkout.razorpay.com/v1/checkout.js` whenever an order payload arrives.
