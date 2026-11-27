import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase/db';

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clinicId = searchParams.get('clinicId') || searchParams.get('clinic_id');

  if (!clinicId) {
    return NextResponse.json(
      { error: 'Missing required query parameter: clinicId' },
      { status: 400, headers: corsHeaders() }
    );
  }

  const clinic = db.getClinic(clinicId);
  if (!clinic) {
    return NextResponse.json(
      { error: `Clinic with ID or slug "${clinicId}" not found` },
      { status: 404, headers: corsHeaders() }
    );
  }

  const departments = db.getDepartments(clinic.id);
  const doctors = db.getDoctors(clinic.id);

  const welcomePrompts: Record<string, string> = {
    en: `Hello! Welcome to ${clinic.name}. I'm your AI Medical Receptionist. How can I help you book or manage your appointment today?`,
    hi: `नमस्ते! ${clinic.name} में आपका स्वागत है। मैं आपका AI मेडिकल रिसेप्शनिस्ट हूँ। आज अपॉइंटमेंट बुक करने में मैं आपकी कैसे सहायता कर सकता हूँ?`,
    kn: `ನಮಸ್ಕಾರ! ${clinic.name} ಗೆ ಸ್ವಾಗತ. ನಾನು ನಿಮ್ಮ AI ಸ್ವಾಗತಕಾರ. ಇಂದು ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಮಾಡಲು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?`,
  };

  return NextResponse.json(
    {
      clinic: {
        id: clinic.id,
        slug: clinic.slug,
        name: clinic.name,
        theme_color: clinic.theme_color,
        supported_languages: clinic.supported_languages,
        booking_policy: clinic.booking_policy,
        emergency_contact: clinic.emergency_contact,
      },
      departments: departments.map(d => ({ id: d.id, name: d.name, description: d.description })),
      doctors: doctors.map(doc => ({
        id: doc.id,
        name: doc.name,
        department: doc.department_name,
        qualification: doc.qualification,
        fee_inr: doc.consultation_fee_inr,
        languages: doc.languages,
      })),
      welcomePrompts,
    },
    { headers: corsHeaders() }
  );
}
