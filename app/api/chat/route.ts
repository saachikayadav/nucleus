import { streamText, createUIMessageStreamResponse, toUIMessageStream } from 'ai';
import { createGroq } from '@ai-sdk/groq';

export const maxDuration = 30;

const API_BASE_URL = process.env.HOSPITAL_API_URL || 'http://localhost:8000';
const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

async function fetchWithTimeout(url: string, options = {}, timeoutMs = 4000) {
  console.log(`[HTTP] Fetching: ${url}`);
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err: any) {
    clearTimeout(id);
    console.error(`[HTTP ERROR] Failure on ${url}:`, err.message);
    return null; 
  }
}

export async function POST(req: Request) {
  console.log('\n======================================================');
  console.log('🚀 [API/CHAT] NEW DIRECT-INJECT REQUEST');
  console.log('======================================================');

  // Parse body safely
  let body;
  try {
    body = await req.json();
  } catch (e) {
    body = {};
  }
  
  const messages = body.messages || [];
  const userName = body.userName || 'Authorized User';
  const userRole = body.userRole || 'Medical Officer';

  const recentMessages = messages.slice(-5);
  
  const coreMessages = recentMessages.map((m: any) => {
    let text = m.content || '';
    if (m.parts && Array.isArray(m.parts)) {
      const textParts = m.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('\n');
      if (textParts && !text.includes(textParts)) text += '\n' + textParts;
    }
    return {
      role: m.role === 'user' ? 'user' : 'assistant',
      content: text.trim() || '[Data Processed]'
    };
  }).filter((m: any) => m.content !== '');

  const lastUserMsg = coreMessages.filter((m: any) => m.role === 'user').pop();
  const uuidMatch = (lastUserMsg?.content || '').match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i);
  const targetSessionId = uuidMatch ? uuidMatch[0] : null;

  let summaryString = 'Unavailable';
  let patientsString = 'Unavailable';
  let targetPatientString = 'No specific session ID was requested.';

  console.log('\n📡 [PRE-FETCH] Pulling telemetry from Hospital API...');
  
  const fetchPromises = [
    fetchWithTimeout(`${API_BASE_URL}/patients/summary`),
    fetchWithTimeout(`${API_BASE_URL}/patients?limit=5`)
  ];

  if (targetSessionId) {
    console.log(`🎯 [DIRECT FETCH] UUID detected in user prompt: ${targetSessionId}`);
    const encodedId = encodeURIComponent(String(targetSessionId).trim());
    fetchPromises.push(fetchWithTimeout(`${API_BASE_URL}/patient/${encodedId}`));
  }

  const results = await Promise.all(fetchPromises);
  const summaryRes = results[0];
  const patientsRes = results[1];
  const targetRes = targetSessionId ? results[2] : null;

  if (summaryRes?.ok) {
    const d = await summaryRes.json();
    summaryString = JSON.stringify({ total: d.total_cases, stats: d.pwat_stats });
  }
  if (patientsRes?.ok) {
    const d = await patientsRes.json();
    const lightweightPatients = (d.sessions || []).map((p: any) => ({
      id: p.session_id, triage: p.triage_category, pwat: p.pwat_score
    }));
    patientsString = JSON.stringify(lightweightPatients);
  }
  
  if (targetRes?.ok) {
    const data = await targetRes.json();
    const truncatedPayload = {
      session_id: data.session_id,
      triage_category: data.patient_triage || data.triage_category,
      pwat_score: data.pwat_score,
      wound_metrics: data.wound_metrics,
      gemini_analysis: data.gemini_analysis
    };
    targetPatientString = JSON.stringify(truncatedPayload);
    console.log('✅ [DIRECT FETCH] Targeted telemetry successfully loaded for prompt.');
  } else if (targetSessionId) {
    targetPatientString = `Database check complete: Session ID '${targetSessionId}' was not found.`;
  }

  const systemPrompt = `You are the "Valkyra Oracle", an advanced tactical AI assistant managing the Valkyra Nucleus medical command center.
Your tone is professional and concise. 
You are currently speaking to: ${userName} (Role: ${userRole}). Address them appropriately based on their role.

REAL-TIME SYSTEM METRICS:
- Summary Overview: ${summaryString}
- Recent Active Sessions: ${patientsString}

REQUESTED TELEMETRY (If applicable):
${targetPatientString}

SYSTEM RULES:
1. Use the data provided above to answer queries. 
2. If targeted telemetry is provided, format it clearly into a tactical medical briefing.`;

  console.log('\n🧠 [GROQ] Initializing AI Stream (Model: llama-3.1-8b-instant)...');

  const result = streamText({
    model: groq('llama-3.1-8b-instant'), 
    system: systemPrompt,
    messages: coreMessages, 
  });

  console.log('🌊 [STREAM] Pushing response stream to frontend...');
  
  return createUIMessageStreamResponse({ 
    stream: toUIMessageStream({ stream: (result as any).stream }) 
  });
}