import { getSupabaseAdmin } from '@/lib/supabase';

interface LeadPayload {
  name?: string;
  email: string;
  phone?: string;
  summary?: string;
  conversation: Array<{ role: string; content: string }>;
  buildType?: string;
  answers?: Record<string, string>;
  effortLow?: number;
  effortHigh?: number;
  disqualifiedReason?: string;
  sessionId?: string;
  honeypot?: string;
}

// Best-effort, per-instance rate limit — no LLM cost risk in Phase 1, this just
// keeps obvious junk out of the leads table. Move to a real store (Upstash/Supabase)
// before this needs to hold across multiple server instances.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX;
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (isRateLimited(ip)) {
    return Response.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const body = await request.json() as LeadPayload;
  const { name, email, phone, summary, conversation, buildType, answers, effortLow, effortHigh, disqualifiedReason, sessionId, honeypot } = body;

  if (honeypot) {
    // Silently accept — don't tip off bots that the field was checked.
    return Response.json({ ok: true });
  }

  if (!email) {
    return Response.json({ ok: false, error: 'Email is required' }, { status: 400 });
  }

  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch {
    console.error('Supabase is not configured — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    return Response.json({ ok: false, error: 'Server not configured' }, { status: 500 });
  }

  const { error } = await supabaseAdmin.from('leads').insert({
    name,
    email,
    phone,
    summary,
    conversation,
    build_type: buildType,
    answers: answers ?? {},
    effort_low: effortLow,
    effort_high: effortHigh,
    disqualified_reason: disqualifiedReason,
    channel: 'web',
    session_id: sessionId,
  });

  if (error) {
    console.error('Supabase insert error:', error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
