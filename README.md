# 🏥 ComedKares — Multilingual Voice-First Agentic AI Receptionist Platform

> **ComedKares** is a plug-and-play, multilingual (`en-IN`, `hi-IN`, `kn-IN`), voice-first Agentic AI Receptionist platform designed to automate healthcare appointment management for multiple clinics.

Clinics independently register, configure doctors, consultation fees, schedules, and policies, and embed a **single `<script>` tag** into their existing website with **zero infrastructure changes**.

---

## 🌟 Key Features

- **Zero-Infrastructure Embed Widget**: A single script `<script src=".../widget.js" data-clinic-id="clinic_alpha" async></script>` embeds an autonomous AI receptionist in an isolated Shadow DOM container (`#comedkares-widget-root`), preventing style conflicts with the clinic's website.
- **Multilingual Voice-First Triage**: Uses the native Browser Web Speech API (`SpeechRecognition` & `SpeechSynthesis`) for zero-latency, zero-cost voice input/output across **English**, **Hindi (Devanagari)**, and **Kannada**, supporting regional medical code-switching.
- **Atomic 5-Minute Slot Locking**: Prevents double-bookings under concurrent patient requests using conditional SQL updates with live countdown timers.
- **Emergency Red-Flag Protocol**: Instantly recognizes acute symptoms (e.g. severe chest pain, shortness of breath, stroke symptoms), halts booking, triggers live red alerts on the staff portal, and routes patients to emergency contacts.
- **Razorpay Payment Integration**: Automatically launches payment checkout modals and validates transactions using HMAC-SHA256 signature verification.
- **Multi-Tenant Staff Dashboard**: Dedicated portal for clinic personnel to monitor active bookings, manage doctor rosters and schedules, handle escalations, and review an immutable audit trail.
- **Strict Multi-Tenant Isolation**: Every database table is isolated by `clinic_id` with PostgreSQL Row-Level Security (RLS).

---

## 🏗️ Architecture

```
                                 [ Clinic Website ]
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼                                         ▼
         [ Web Speech STT / TTS ]                  [ Isolated Shadow DOM ]
         (en-IN, hi-IN, kn-IN)                     (public/widget.js)
                    │                                         │
                    └────────────────────┬────────────────────┘
                                         ▼
                         [ ComedKares Next.js 15 Platform ]
                                         │
       ┌──────────────────┬──────────────┴──────────────┬──────────────────┐
       ▼                  ▼                             ▼                  ▼
[ Gemini 2.5 Flash ]  [ Atomic Slot Hold ]       [ Razorpay HMAC ]   [ Staff Portal ]
 Native Tool Loop      5-Min Lock Timer           Order & Webhooks    Realtime Dashboard
       │                  │                             │                  │
       └──────────────────┴──────────────┬──────────────┴──────────────────┘
                                         ▼
                           [ Supabase Multi-Tenant DB ]
                           (PostgreSQL + RLS + Audit)
```

---

## 📁 Repository Directory Structure

```
.
├── GEMINI.md                     # Antigravity architectural specification & schema rules
├── public/
│   ├── widget.js                 # Compiled standalone Shadow DOM widget bundle (22.2 KB)
│   └── demo/
│       ├── clinic-alpha.html     # Demo Site 1: Sparsh Dental & Maxillofacial Clinic
│       └── clinic-beta.html      # Demo Site 2: Sahyadri Ortho & Spine Center
├── scripts/
│   └── build-widget.mjs          # esbuild bundler script (src/widget/index.ts -> public/widget.js)
├── src/
│   ├── app/
│   │   ├── (auth)/login/         # Clinic staff authentication & tenant switcher
│   │   ├── onboarding/           # Self-service clinic registration & script generator
│   │   ├── dashboard/            # Authenticated staff portal (Appointments, Schedule, Audit)
│   │   └── api/
│   │       ├── widget/config/    # GET clinic branding, departments, welcome prompts
│   │       ├── agent/chat/       # POST conversational turn + Gemini tool execution loop
│   │       ├── otp/              # POST send & verify patient OTP
│   │       ├── payments/order/   # POST create Razorpay order for held slot
│   │       ├── payments/verify-client/ # POST HMAC signature verification for client payment
│   │       ├── webhooks/razorpay/# POST HMAC-SHA256 verified Razorpay webhook
│   │       └── staff/            # GET / POST staff dashboard data & overrides
│   ├── lib/
│   │   ├── supabase/             # Multi-tenant store, schema types, atomic lock query
│   │   ├── gemini/               # System prompts, tool declarations, tool execution loop
│   │   └── razorpay.ts           # Razorpay client & HMAC signature verification
│   └── widget/
│       ├── index.ts              # Shadow DOM mount, Web Speech STT/TTS, Razorpay checkout
│       └── styles.css            # Scoped widget styles injected inside ShadowRoot
├── supabase/
│   ├── schema.sql                # Multi-tenant DDL + indexes + RLS policies
│   └── seed.sql                  # Seed data for Clinic Alpha & Clinic Beta
├── test-e2e.mjs                  # Automated end-to-end verification test suite
└── package.json
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js 18+ (tested on Node v20 / v24)
- npm or pnpm

### 2. Installation
```bash
git clone <repository_url>
cd Agentic_Clinic
npm install
```

### 3. Environment Setup
Copy the example environment configuration:
```bash
cp .env.example .env.local
```
*(The platform runs seamlessly out-of-the-box in demo mode without external API keys. See `.env.example` to connect live Google Gemini, Supabase, and Razorpay credentials).*

### 4. Build Widget & Start Application
```bash
# Compile standalone widget bundle
npm run build:widget

# Run development server
npm run dev

# Or run production build
npm run build
npm start
```

### 5. Access Demos & Portals
- **ComedKares Home Hub**: [http://localhost:3000](http://localhost:3000)
- **Demo Site 1 (Sparsh Dental)**: [http://localhost:3000/demo/clinic-alpha.html](http://localhost:3000/demo/clinic-alpha.html)
- **Demo Site 2 (Sahyadri Ortho)**: [http://localhost:3000/demo/clinic-beta.html](http://localhost:3000/demo/clinic-beta.html)
- **Staff Management Dashboard**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Self-Service Clinic Onboarding**: [http://localhost:3000/onboarding](http://localhost:3000/onboarding)

---

## 🧪 Automated End-to-End Verification

Run the end-to-end verification suite:
```bash
node test-e2e.mjs
```
The test suite validates:
1. Widget script compilation and Shadow DOM root attachment.
2. Independent demo clinic websites and tenant data isolation.
3. Multilingual receptionist conversational turn execution.
4. OTP verification and 5-minute atomic slot hold locking.
5. Razorpay order generation and HMAC payment confirmation.
6. Emergency red-flag triage protocol (`"severe chest pain"` triggers human escalation).
7. Live staff dashboard metrics, emergency alerts, and immutable audit logs.

---

## 🔒 Security & Compliance
- **Zero Secrets Committed**: All `.env*` and credential files are excluded by `.gitignore`.
- **Immutable Audit Logging**: Every state-changing action (`SLOT_HOLD_5MIN`, `PAYMENT_CONFIRMED`, `EMERGENCY_ESCALATION`, `APPOINTMENT_CANCELLED`) records actor type, timestamp, entity ID, and metadata.
- **Tenant Isolation**: All queries enforce clinic scoping with foreign-key integrity.

---

## 📄 License
MIT License. Built for multi-clinic healthcare accessibility.
