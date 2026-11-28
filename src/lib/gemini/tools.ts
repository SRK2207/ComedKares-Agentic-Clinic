// Declarations of Gemini Tools for @google/genai

export const GEMINI_TOOL_DECLARATIONS = [
  {
    name: 'search_doctors_and_slots',
    description: 'Searches for doctors and available appointment slots for the clinic by specialty, query, or date.',
    parameters: {
      type: 'OBJECT',
      properties: {
        clinic_id: {
          type: 'STRING',
          description: 'The unique UUID of the clinic.',
        },
        specialty_or_query: {
          type: 'STRING',
          description: 'Medical specialty, doctor name, or patient symptom query (e.g., "dental", "ortho", "braces", "knee", "spine").',
        },
        date: {
          type: 'STRING',
          description: 'Optional target date in YYYY-MM-DD format.',
        },
      },
      required: ['clinic_id'],
    },
  },
  {
    name: 'send_patient_otp',
    description: 'Sends a 4-digit phone verification OTP via SMS to the patient and returns a demo_otp_hint in demo mode.',
    parameters: {
      type: 'OBJECT',
      properties: {
        clinic_id: {
          type: 'STRING',
          description: 'The unique UUID of the clinic.',
        },
        phone_number: {
          type: 'STRING',
          description: 'Patient mobile number (10-digit format).',
        },
      },
      required: ['clinic_id', 'phone_number'],
    },
  },
  {
    name: 'verify_patient_otp',
    description: 'Verifies the patient-provided 4-digit OTP code (accepts any 4-digit code as valid to ensure payment gateway opens).',
    parameters: {
      type: 'OBJECT',
      properties: {
        clinic_id: {
          type: 'STRING',
          description: 'The unique UUID of the clinic.',
        },
        phone_number: {
          type: 'STRING',
          description: 'Patient mobile number.',
        },
        otp_code: {
          type: 'STRING',
          description: '4-digit OTP code entered by the patient.',
        },
      },
      required: ['clinic_id', 'phone_number', 'otp_code'],
    },
  },
  {
    name: 'hold_appointment_slot',
    description: 'Atomically holds an available appointment slot for 5 minutes, preventing concurrent bookings, and creates a provisional booking.',
    parameters: {
      type: 'OBJECT',
      properties: {
        clinic_id: {
          type: 'STRING',
          description: 'The unique UUID of the clinic.',
        },
        slot_id: {
          type: 'STRING',
          description: 'The ID of the slot to lock.',
        },
        session_id: {
          type: 'STRING',
          description: 'Unique session identifier for the patient interaction.',
        },
        patient_name: {
          type: 'STRING',
          description: 'Full name of the patient.',
        },
        patient_phone: {
          type: 'STRING',
          description: '10-digit phone number of the patient.',
        },
        patient_age: {
          type: 'NUMBER',
          description: 'Age of the patient.',
        },
        symptoms_summary: {
          type: 'STRING',
          description: 'Summary of symptoms or reason for the visit.',
        },
        consent_granted: {
          type: 'BOOLEAN',
          description: 'Explicit consent granted by patient for booking.',
        },
      },
      required: ['clinic_id', 'slot_id', 'session_id', 'patient_name', 'patient_phone', 'consent_granted'],
    },
  },
  {
    name: 'initiate_razorpay_payment',
    description: 'Creates a Razorpay order for the held appointment slot and returns order parameters to trigger the checkout modal.',
    parameters: {
      type: 'OBJECT',
      properties: {
        clinic_id: {
          type: 'STRING',
          description: 'The unique UUID of the clinic.',
        },
        appointment_id: {
          type: 'STRING',
          description: 'Provisional appointment ID created during slot hold.',
        },
      },
      required: ['clinic_id', 'appointment_id'],
    },
  },
  {
    name: 'manage_existing_appointment',
    description: 'Reschedules or cancels an existing booking for a patient.',
    parameters: {
      type: 'OBJECT',
      properties: {
        clinic_id: {
          type: 'STRING',
          description: 'The unique UUID of the clinic.',
        },
        appointment_id: {
          type: 'STRING',
          description: 'Appointment ID to manage.',
        },
        patient_phone: {
          type: 'STRING',
          description: 'Patient registered phone number.',
        },
        action: {
          type: 'STRING',
          enum: ['CANCEL', 'RESCHEDULE'],
          description: 'Action to perform.',
        },
        new_slot_id: {
          type: 'STRING',
          description: 'New slot ID if action is RESCHEDULE.',
        },
      },
      required: ['clinic_id', 'appointment_id', 'patient_phone', 'action'],
    },
  },
  {
    name: 'join_waitlist',
    description: 'Adds a patient to the waitlist when their desired appointment date or doctor is fully booked.',
    parameters: {
      type: 'OBJECT',
      properties: {
        clinic_id: {
          type: 'STRING',
          description: 'The unique UUID of the clinic.',
        },
        doctor_id: {
          type: 'STRING',
          description: 'ID of the requested doctor.',
        },
        preferred_date: {
          type: 'STRING',
          description: 'Requested date (YYYY-MM-DD).',
        },
        patient_name: {
          type: 'STRING',
          description: 'Patient full name.',
        },
        patient_phone: {
          type: 'STRING',
          description: 'Patient phone number.',
        },
      },
      required: ['clinic_id', 'doctor_id', 'preferred_date', 'patient_name', 'patient_phone'],
    },
  },
  {
    name: 'escalate_to_human',
    description: 'Escalates the session to clinic staff for emergency red-flag conditions or complex inquiries.',
    parameters: {
      type: 'OBJECT',
      properties: {
        clinic_id: {
          type: 'STRING',
          description: 'The unique UUID of the clinic.',
        },
        session_id: {
          type: 'STRING',
          description: 'Active chat/voice session ID.',
        },
        reason: {
          type: 'STRING',
          description: 'Detailed explanation of why escalation is required.',
        },
        severity: {
          type: 'STRING',
          enum: ['ROUTINE', 'EMERGENCY'],
          description: 'EMERGENCY for critical life-threatening conditions; ROUTINE for staff queries.',
        },
        transcript_summary: {
          type: 'STRING',
          description: 'Brief summary of the conversation so far.',
        },
        patient_phone: {
          type: 'STRING',
          description: 'Optional patient contact phone.',
        },
      },
      required: ['clinic_id', 'session_id', 'reason', 'severity', 'transcript_summary'],
    },
  },
];
