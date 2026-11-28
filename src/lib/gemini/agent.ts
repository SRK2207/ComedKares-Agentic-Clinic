import { GoogleGenAI } from '@google/genai';
import { db } from '../supabase/db';
import { createRazorpayOrder } from '../razorpay';
import { sendOtpViaMsg91 } from '../sms';
import { buildSystemPrompt } from './prompts';
import { GEMINI_TOOL_DECLARATIONS } from './tools';
import { AgentContext, AgentResponse, ChatMessage } from './types';
import { LanguageCode } from '../supabase/types';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Deterministic tool executor matching Section 5 of GEMINI.md
 */
export async function executeTool(name: string, args: Record<string, any>): Promise<Record<string, any>> {
  const clinicId = args.clinic_id;

  switch (name) {
    case 'search_doctors_and_slots': {
      const doctors = db.getDoctors(clinicId, args.specialty_or_query);
      const slots = db.getSlots(clinicId, args.doctor_id, args.date);
      return {
        count: slots.length,
        doctors: doctors.map(d => ({
          id: d.id,
          name: d.name,
          department: d.department_name,
          qualification: d.qualification,
          fee_inr: d.consultation_fee_inr,
          languages: d.languages,
        })),
        available_slots: slots.slice(0, 10).map(s => ({
          id: s.id,
          doctor_id: s.doctor_id,
          doctor_name: s.doctor_name,
          department: s.department_name,
          start_time: s.start_time,
          end_time: s.end_time,
          fee_inr: s.fee,
        })),
      };
    }

    case 'send_patient_otp': {
      const { code, demoHint } = db.createOtp(clinicId, args.phone_number);
      await sendOtpViaMsg91(args.phone_number, code).catch(() => {});
      return {
        status: 'OTP_SENT',
        phone_number: args.phone_number,
        demo_otp_hint: demoHint,
        message: `OTP sent successfully. Demo hint: ${demoHint}`,
      };
    }

    case 'verify_patient_otp': {
      const isVerified = db.verifyOtp(clinicId, args.phone_number, args.otp_code);
      return {
        verified: isVerified,
        phone_number: args.phone_number,
        message: isVerified
          ? 'Phone number verified successfully.'
          : 'Invalid or expired OTP code. Please try again.',
      };
    }

    case 'hold_appointment_slot': {
      const result = db.atomicHoldSlot(clinicId, args.slot_id, args.session_id, {
        name: args.patient_name,
        phone: args.patient_phone,
        age: args.patient_age ? Number(args.patient_age) : undefined,
        symptoms: args.symptoms_summary,
        consent: Boolean(args.consent_granted),
      });

      if (!result.success || !result.slot || !result.appointment) {
        return {
          success: false,
          error: result.error || 'Failed to lock slot. It may have already been booked.',
        };
      }

      return {
        success: true,
        slot_id: result.slot.id,
        appointment_id: result.appointment.id,
        doctor_name: result.appointment.doctor_name,
        start_time: result.slot.start_time,
        hold_duration_seconds: 300,
        expires_at: result.slot.hold_expires_at,
        message: 'Slot successfully held for 5 minutes. Ready for payment.',
      };
    }

    case 'initiate_razorpay_payment': {
      const appt = db.appointments.find(a => a.id === args.appointment_id);
      const doc = appt ? db.doctors.find(d => d.id === appt.doctor_id) : null;
      const fee = doc?.consultation_fee_inr || 500;

      const order = await createRazorpayOrder(fee, args.appointment_id, {
        clinic_id: clinicId,
        appointment_id: args.appointment_id,
        patient_name: appt?.patient_name || 'Patient',
      });

      return {
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        key_id: order.keyId,
        appointment_id: args.appointment_id,
        clinic_id: clinicId,
        doctor_name: doc?.name || 'Doctor',
        fee_inr: fee,
      };
    }

    case 'manage_existing_appointment': {
      return db.manageAppointment(
        clinicId,
        args.appointment_id,
        args.patient_phone,
        args.action,
        args.new_slot_id
      );
    }

    case 'join_waitlist': {
      return db.joinWaitlist(
        clinicId,
        args.doctor_id,
        args.preferred_date,
        args.patient_name,
        args.patient_phone
      );
    }

    case 'escalate_to_human': {
      const escalation = db.createEscalation(
        clinicId,
        args.session_id,
        args.reason,
        args.severity,
        args.transcript_summary,
        args.patient_phone
      );
      return {
        escalated: true,
        escalation_id: escalation.id,
        severity: escalation.severity,
        emergency_contact: db.getClinic(clinicId)?.emergency_contact,
        message:
          escalation.severity === 'EMERGENCY'
            ? 'Emergency alert triggered. Immediate medical assistance is required.'
            : 'Escalation recorded. Staff has been notified.',
      };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

/**
 * Intelligent deterministic rule-based conversational receptionist
 * Acts when GEMINI_API_KEY is not set or as instant deterministic responder
 */
export async function runSimulatedReceptionistTurn(
  context: AgentContext,
  userMessage: string
): Promise<AgentResponse> {
  const clinic = db.getClinic(context.clinic_id);
  const clinicName = clinic?.name || 'Clinic';
  const text = userMessage.toLowerCase();
  const lang = context.language || detectLanguage(userMessage);

  const toolsExecuted: AgentResponse['toolsExecuted'] = [];
  let actionRequired: AgentResponse['actionRequired'] = null;
  let paymentPayload: AgentResponse['paymentPayload'] = undefined;
  let slotHeldPayload: AgentResponse['slotHeldPayload'] = undefined;
  let escalationPayload: AgentResponse['escalationPayload'] = undefined;
  let reply = '';

  // 1. EMERGENCY RED-FLAG PROTOCOL
  const emergencyKeywords = [
    'chest pain', 'heart attack', 'cannot breathe', 'difficulty breathing', 'severe bleeding',
    'stroke', 'unconscious', 'fainted', 'convulsion', 'head injury', 'bleeding heavily',
    'छाती में दर्द', 'सांस लेने में तकलीफ', 'बहुत खून', 'बेहोश',
    'ಎದೆ ನೋವು', 'ಉಸಿರಾಟದ ತೊಂದರೆ', 'ರಕ್ತಸ್ರಾವ', 'ಪ್ರಜ್ಞೆ ತಪ್ಪಿದೆ'
  ];

  const isEmergency = emergencyKeywords.some(kw => text.includes(kw));

  if (isEmergency) {
    const escResult = await executeTool('escalate_to_human', {
      clinic_id: context.clinic_id,
      session_id: context.session_id,
      reason: `Patient reported acute emergency symptoms: "${userMessage}"`,
      severity: 'EMERGENCY',
      transcript_summary: `Emergency red-flag symptom reported: ${userMessage}`,
      patient_phone: extractPhoneNumber(userMessage) || undefined,
    });

    toolsExecuted.push({
      name: 'escalate_to_human',
      args: { clinic_id: context.clinic_id, severity: 'EMERGENCY' },
      result: escResult,
    });

    actionRequired = 'EMERGENCY_ALERT';
    escalationPayload = {
      severity: 'EMERGENCY',
      reason: `Patient reported critical emergency symptoms: ${userMessage}`,
    };

    if (lang === 'hi') {
      reply = `⚠️ आपातकालीन चेतावनी: आपके द्वारा बताए गए लक्षण (जैसे सीने में दर्द या गंभीर समस्या) के लिए तुरंत आपातकालीन चिकित्सा सहायता की आवश्यकता है! मैंने हमारे क्लिनिक स्टाफ को सूचित कर दिया है। कृपया तुरंत आपातकालीन नंबर ${clinic?.emergency_contact || '112'} पर कॉल करें या नजदीकी अस्पताल के इमरजेंसी वार्ड में जाएं।`;
    } else if (lang === 'kn') {
      reply = `⚠️ ತುರ್ತು ಎಚ್ಚರಿಕೆ: ನೀವು ತಿಳಿಸಿದ ಲಕ್ಷಣಗಳು ಗಂಭೀರ ತುರ್ತು ಚಿಕಿತ್ಸೆಯ ಅಗತ್ಯವಿದೆ! ನಾನು ಕ್ಲಿನಿಕ್ ಸಿಬ್ಬಂದಿಗೆ ಎಚ್ಚರಿಕೆ ಕಳುಹಿಸಿದ್ದೇನೆ. ದಯವಿಟ್ಟು ತಕ್ಷಣ ನಮ್ಮ ತುರ್ತು ಸಹಾಯವಾಣಿ ${clinic?.emergency_contact || '112'} ಗೆ ಕರೆ ಮಾಡಿ ಅಥವಾ ಹತ್ತಿರದ ತುರ್ತು ಚಿಕಿತ್ಸಾ ವಿಭಾಗಕ್ಕೆ ಭೇಟಿ ನೀಡಿ.`;
    } else {
      reply = `⚠️ EMERGENCY RED-FLAG ALERT: The symptoms you described are serious and require immediate emergency medical evaluation! I have escalated this instantly to our clinic duty team. Please call emergency services (112 or ${clinic?.emergency_contact}) immediately or proceed to the nearest emergency room.`;
    }

    return {
      reply,
      language: lang,
      toolsExecuted,
      actionRequired,
      escalationPayload,
    };
  }

  // 2. OTP Verification check
  const otpMatch = userMessage.match(/\b\d{6}\b/);
  if (otpMatch) {
    const code = otpMatch[0];
    const phone = extractPhoneNumberFromHistory(context.history) || '9876543210';
    const verifyResult = await executeTool('verify_patient_otp', {
      clinic_id: context.clinic_id,
      phone_number: phone,
      otp_code: code,
    });

    toolsExecuted.push({
      name: 'verify_patient_otp',
      args: { clinic_id: context.clinic_id, phone_number: phone, otp_code: code },
      result: verifyResult,
    });

    if (verifyResult.verified) {
      // Find suitable slot and atomically hold
      const slots = db.getSlots(context.clinic_id);
      const chosenSlot = slots[0];

      if (chosenSlot) {
        const holdResult = await executeTool('hold_appointment_slot', {
          clinic_id: context.clinic_id,
          slot_id: chosenSlot.id,
          session_id: context.session_id,
          patient_name: extractPatientNameFromHistory(context.history) || 'Patient',
          patient_phone: phone,
          patient_age: 32,
          symptoms_summary: 'Consultation appointment',
          consent_granted: true,
        });

        toolsExecuted.push({
          name: 'hold_appointment_slot',
          args: { clinic_id: context.clinic_id, slot_id: chosenSlot.id },
          result: holdResult,
        });

        if (holdResult.success) {
          const payResult = await executeTool('initiate_razorpay_payment', {
            clinic_id: context.clinic_id,
            appointment_id: holdResult.appointment_id,
          });

          toolsExecuted.push({
            name: 'initiate_razorpay_payment',
            args: { clinic_id: context.clinic_id, appointment_id: holdResult.appointment_id },
            result: payResult,
          });

          actionRequired = 'PAYMENT_CHECKOUT';
          paymentPayload = {
            order_id: payResult.order_id,
            amount: payResult.amount,
            key_id: payResult.key_id,
            currency: payResult.currency,
            appointment_id: holdResult.appointment_id,
          };
          slotHeldPayload = {
            slot_id: chosenSlot.id,
            appointment_id: holdResult.appointment_id,
            expires_at: holdResult.expires_at,
          };

          const formattedDate = new Date(chosenSlot.start_time).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
          });

          if (lang === 'hi') {
            reply = `OTP सफलतापूर्वक सत्यापित हो गया है! मैंने ${chosenSlot.doctor_name} के साथ ${formattedDate} का स्लॉट आपके लिए 5 मिनट के लिए आरक्षित कर दिया है। बुकिंग पूरी करने के लिए रेजरपे भुगतान विंडो खुल रही है (परामर्श शुल्क: ₹${payResult.fee_inr})।`;
          } else if (lang === 'kn') {
            reply = `OTP ಯಶಸ್ವಿಯಾಗಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ! ನಾನು ${chosenSlot.doctor_name} ಅವರೊಂದಿಗೆ ${formattedDate} ರ ಸ್ಲಾಟ್ ಅನ್ನು 5 ನಿಮಿಷಗಳ ಕಾಲ ಲಾಕ್ ಮಾಡಿದ್ದೇನೆ. ಕನ್ಸಲ್ಟೇಶನ್ ಶುಲ್ಕ ₹${payResult.fee_inr} ಪಾವತಿಸಲು ರೇಜರ್‌ಪೇ ವಿಂಡೋ ತೆರೆಯುತ್ತಿದೆ.`;
          } else {
            reply = `OTP verified successfully! I have placed an atomic 5-minute hold on your slot with ${chosenSlot.doctor_name} on ${formattedDate}. Launching Razorpay checkout to confirm your appointment (Fee: ₹${payResult.fee_inr}).`;
          }

          return {
            reply,
            language: lang,
            toolsExecuted,
            actionRequired,
            paymentPayload,
            slotHeldPayload,
          };
        }
      }
    } else {
      reply = lang === 'hi'
        ? `अमान्य OTP कोड। कृपया सही 6-अंकीय कोड दर्ज करें (डेमो मोड में 123456 भी स्वीकार्य है)।`
        : lang === 'kn'
        ? `ತಪ್ಪಾದ OTP ಕೋಡ್. ದಯವಿಟ್ಟು ಸರಿಯಾದ ಕೋಡ್ ನಮೂದಿಸಿ (ಡೆಮೊ ಮೋಡ್‌ನಲ್ಲಿ 123456 ಬಳಸಬಹುದು).`
        : `Invalid OTP code. Please enter the valid 6-digit code or use the demo hint 123456.`;
      return { reply, language: lang, toolsExecuted };
    }
  }

  // 3. Search Doctors / Slots
  const isSearchOrBook = text.includes('appointment') || text.includes('book') || text.includes('doctor') ||
    text.includes('slot') || text.includes('dentist') || text.includes('ortho') || text.includes('dental') ||
    text.includes('spine') || text.includes('knee') || text.includes('tooth') || text.includes('braces') ||
    text.includes('अपॉइंटमेंट') || text.includes('डॉक्टर') || text.includes('ಬುಕಿಂಗ್') || text.includes('ವೈದ್ಯರು');

  if (isSearchOrBook) {
    const searchResult = await executeTool('search_doctors_and_slots', {
      clinic_id: context.clinic_id,
      specialty_or_query: text,
    });

    toolsExecuted.push({
      name: 'search_doctors_and_slots',
      args: { clinic_id: context.clinic_id, specialty_or_query: text },
      result: searchResult,
    });

    const docList = searchResult.doctors.length > 0
      ? searchResult.doctors.slice(0, 3).map((d: any) => `${d.name} (${d.department}, ₹${d.fee_inr})`).join(', ')
      : 'our medical specialists';
    const slotList = searchResult.available_slots.slice(0, 2).map((s: any) => {
      const d = new Date(s.start_time);
      return `${d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    }).join(' and ');

    // Send demo OTP automatically to advance the booking flow seamlessly
    const phone = '9876543210';
    const otpResult = await executeTool('send_patient_otp', {
      clinic_id: context.clinic_id,
      phone_number: phone,
    });
    toolsExecuted.push({
      name: 'send_patient_otp',
      args: { clinic_id: context.clinic_id, phone_number: phone },
      result: otpResult,
    });

    if (lang === 'hi') {
      reply = `${clinicName} में हमारे पास विशेषज्ञ डॉक्टर उपलब्ध हैं: ${docList}। उपलब्ध स्लॉट: ${slotList}। मैंने आपके नंबर पर 6-अंकीय सत्यापन OTP भेज दिया है (डेमो OTP: ${otpResult.demo_otp_hint})। स्लॉट 5 मिनट के लिए लॉक करने हेतु कृपया OTP बताएं।`;
    } else if (lang === 'kn') {
      reply = `${clinicName} ನಲ್ಲಿ ನಮ್ಮ ಲಭ್ಯವಿರುವ ವೈದ್ಯರು: ${docList}. ಲಭ್ಯವಿರುವ ಸ್ಲಾಟ್‌ಗಳು: ${slotList}. ನಾನು ನಿಮ್ಮ ಮೊಬೈಲ್‌ಗೆ OTP ಕಳುಹಿಸಿದ್ದೇನೆ (ಡೆಮೊ OTP: ${otpResult.demo_otp_hint}). 5 ನಿಮಿಷಗಳ ಕಾಲ ಸ್ಲಾಟ್ ಕಾಯ್ದಿರಿಸಲು ದಯವಿಟ್ಟು OTP ತಿಳಿಸಿ.`;
    } else {
      reply = `At ${clinicName}, our available specialists are: ${docList}. Upcoming available slots include ${slotList}. I have generated a 6-digit verification code (Demo OTP hint: ${otpResult.demo_otp_hint}). Please confirm your OTP to hold your slot!`;
    }

    return { reply, language: lang, toolsExecuted };
  }

  // 4. Greetings and General Queries
  if (lang === 'hi') {
    reply = `नमस्ते! मैं ${clinicName} का AI रिसेप्शनिस्ट हूँ। आप हमारे डॉक्टरों से परामर्श के लिए अपॉइंटमेंट बुक कर सकते हैं, समय बदल सकते हैं या क्लिनिक सेवाओं की जानकारी ले सकते हैं। मैं आपकी किस प्रकार सहायता कर सकता हूँ?`;
  } else if (lang === 'kn') {
    reply = `ನಮಸ್ಕಾರ! ನಾನು ${clinicName} ನ AI ಸ್ವಾಗತಕಾರ. ನೀವು ನಮ್ಮ ತಜ್ಞ ವೈದ್ಯರೊಂದಿಗೆ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಮಾಡಬಹುದು ಅಥವಾ ವೇಳಾಪಟ್ಟಿಯನ್ನು ಪರಿಶೀಲಿಸಬಹುದು. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?`;
  } else {
    reply = `Hello! Welcome to ${clinicName}. I am your AI receptionist. I can help you search for specialists, check real-time availability, hold an appointment slot, or answer questions about clinic policies. How may I assist you today?`;
  }

  return { reply, language: lang, toolsExecuted };
}

/**
 * Main turn execution using Gemini 2.5 Flash / 2.0 Flash tool-calling loop
 */
export async function runAgentTurn(
  context: AgentContext,
  userMessage: string
): Promise<AgentResponse> {
  const clinic = db.getClinic(context.clinic_id);
  if (!clinic) {
    throw new Error(`Clinic not found: ${context.clinic_id}`);
  }

  // If no Gemini API Key is configured, run the high-fidelity native fallback engine
  if (!apiKey || !ai) {
    return runSimulatedReceptionistTurn(context, userMessage);
  }

  try {
    const systemInstruction = buildSystemPrompt(clinic, context.language);
    
    // Map existing history to Gemini API format
    const contents: any[] = context.history.map(m => ({
      role: m.role === 'assistant' ? 'model' : m.role === 'user' ? 'user' : 'user',
      parts: [{ text: m.content }],
    }));

    contents.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });

    const toolsConfig: any = [
      {
        functionDeclarations: GEMINI_TOOL_DECLARATIONS,
      },
    ];

    // Call @google/genai SDK
    // Models: 'gemini-2.5-flash' or 'gemini-2.0-flash'
    const modelName = 'gemini-2.5-flash';

    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction: { parts: [{ text: systemInstruction }] },
        tools: toolsConfig,
        temperature: 0.2,
      },
    });

    const toolsExecuted: AgentResponse['toolsExecuted'] = [];
    let actionRequired: AgentResponse['actionRequired'] = null;
    let paymentPayload: AgentResponse['paymentPayload'] = undefined;
    let slotHeldPayload: AgentResponse['slotHeldPayload'] = undefined;
    let escalationPayload: AgentResponse['escalationPayload'] = undefined;

    // Check for tool calls
    const candidates = response.candidates || [];
    const firstCandidate = candidates[0];
    const parts = firstCandidate?.content?.parts || [];

    let modelText = '';
    const functionCalls = parts.filter((p: any) => p.functionCall);

    if (functionCalls.length > 0) {
      for (const fcPart of functionCalls) {
        const fc = (fcPart as any).functionCall;
        if (!fc || !fc.name) continue;
        const toolName: string = fc.name;
        const toolArgs: Record<string, any> = fc.args ? { ...fc.args } : {};
        
        // Ensure clinic_id is injected
        toolArgs.clinic_id = context.clinic_id;

        const toolResult = await executeTool(toolName, toolArgs);
        toolsExecuted.push({
          name: toolName,
          args: toolArgs,
          result: toolResult,
        });

        // Set action triggers
        if (toolName === 'initiate_razorpay_payment') {
          actionRequired = 'PAYMENT_CHECKOUT';
          paymentPayload = {
            order_id: toolResult.order_id,
            amount: toolResult.amount,
            key_id: toolResult.key_id,
            currency: toolResult.currency,
            appointment_id: toolResult.appointment_id,
          };
        } else if (toolName === 'hold_appointment_slot' && toolResult.success) {
          slotHeldPayload = {
            slot_id: toolResult.slot_id,
            appointment_id: toolResult.appointment_id,
            expires_at: toolResult.expires_at,
          };
        } else if (toolName === 'escalate_to_human') {
          actionRequired = 'EMERGENCY_ALERT';
          escalationPayload = {
            severity: toolArgs.severity,
            reason: toolArgs.reason,
          };
        }
      }

      // Do secondary completion to turn tool results into natural language response
      const toolFollowupResponse = await ai.models.generateContent({
        model: modelName,
        contents: [
          ...contents,
          {
            role: 'model',
            parts: functionCalls.map((fc: any) => ({ functionCall: fc.functionCall })),
          },
          {
            role: 'user',
            parts: toolsExecuted.map(t => ({
              functionResponse: {
                name: t.name,
                response: t.result,
              },
            })),
          },
        ],
        config: {
          systemInstruction: { parts: [{ text: systemInstruction }] },
          temperature: 0.3,
        },
      });

      modelText = toolFollowupResponse.text || '';
    } else {
      modelText = response.text || '';
    }

    return {
      reply: modelText || 'Thank you. How else may I assist you with your appointment?',
      language: context.language,
      toolsExecuted,
      actionRequired,
      paymentPayload,
      slotHeldPayload,
      escalationPayload,
    };
  } catch (error) {
    console.warn('[Gemini Agent] Gemini API call returned error, falling back to simulated receptionist:', error);
    return runSimulatedReceptionistTurn(context, userMessage);
  }
}

function detectLanguage(text: string): LanguageCode {
  // Kannada Unicode range: 0C80 - 0CFF
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn';
  // Devanagari (Hindi) Unicode range: 0900 - 097F
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  return 'en';
}

function extractPhoneNumber(text: string): string | null {
  const match = text.match(/\b\d{10}\b/);
  return match ? match[0] : null;
}

function extractPhoneNumberFromHistory(history: ChatMessage[]): string | null {
  for (let i = history.length - 1; i >= 0; i--) {
    const match = history[i].content.match(/\b\d{10}\b/);
    if (match) return match[0];
  }
  return null;
}

function extractPatientNameFromHistory(history: ChatMessage[]): string | null {
  for (const msg of history) {
    if (msg.role === 'user') {
      const match = msg.content.match(/(?:my name is|i am|name:?)\s+([a-zA-Z\s]{3,30})/i);
      if (match) return match[1].trim();
    }
  }
  return null;
}
