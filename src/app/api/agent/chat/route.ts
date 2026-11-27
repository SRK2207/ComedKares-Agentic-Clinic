import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase/db';
import { runAgentTurn } from '@/lib/gemini/agent';
import { AgentContext } from '@/lib/gemini/types';
import { LanguageCode } from '@/lib/supabase/types';

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
    const {
      clinic_id,
      session_id = `sess_${Date.now()}`,
      message,
      language = 'en',
      history = [],
    } = body;

    if (!clinic_id || !message) {
      return NextResponse.json(
        { error: 'clinic_id and message are required' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const clinic = db.getClinic(clinic_id);
    if (!clinic) {
      return NextResponse.json(
        { error: `Clinic "${clinic_id}" not found` },
        { status: 404, headers: corsHeaders() }
      );
    }

    const context: AgentContext = {
      clinic_id: clinic.id,
      clinic_name: clinic.name,
      session_id,
      language: (language as LanguageCode) || 'en',
      history: Array.isArray(history) ? history : [],
    };

    const agentResult = await runAgentTurn(context, message);

    // Audit log this interaction turn
    db.logAudit({
      clinic_id: clinic.id,
      actor_type: 'AI_AGENT',
      actor_id: session_id,
      action: 'CONVERSATION_TURN',
      entity_type: 'session',
      entity_id: session_id,
      metadata: {
        user_message: message,
        language: agentResult.language,
        tools_executed: agentResult.toolsExecuted.map(t => t.name),
        action_required: agentResult.actionRequired,
      },
    });

    return NextResponse.json(
      {
        session_id,
        reply: agentResult.reply,
        language: agentResult.language,
        toolsExecuted: agentResult.toolsExecuted,
        actionRequired: agentResult.actionRequired,
        paymentPayload: agentResult.paymentPayload,
        slotHeldPayload: agentResult.slotHeldPayload,
        escalationPayload: agentResult.escalationPayload,
      },
      { headers: corsHeaders() }
    );
  } catch (error: any) {
    console.error('[API Agent Chat Error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Agent Chat Error' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
