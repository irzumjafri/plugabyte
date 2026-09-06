import { getSupabaseAdmin } from '@/lib/supabase';

interface LeadPayload {
  name?: string;
  email: string;
  phone?: string;
  conversation: Array<{ role: string; content: string }>;
  buildType?: string;
  answers?: Record<string, string>;
  effortLow?: number;
  effortHigh?: number;
  sessionId?: string;
  specId?: string;
}

// Best-effort, per-instance rate limit — no LLM cost risk in Phase 1, this just
// keeps obvious junk out of the leads table. Move to a real store (Upstash/Supabase)
// before this needs to hold across multiple server instances.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const hits = new Map<string, number[]>();

// A lead is a few KB; anything approaching this is abuse, not a prospect.
const MAX_BODY_BYTES = 256 * 1024;
const MAX_MESSAGES = 200;
const MAX_CONTENT_CHARS = 4000;
const MAX_FIELD_CHARS = 200;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  // Sweep every call: pruning only the caller's own key left dead IPs in the
  // map for the life of the process, so it grew without bound.
  for (const [key, times] of hits) {
    const live = times.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    if (live.length === 0) hits.delete(key);
    else hits.set(key, live);
  }

  const recent = hits.get(ip) ?? [];
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX;
}

// Deliberately permissive: this rejects obvious junk, not unusual-but-valid
// addresses. Real verification is the reply we send.
function looksLikeEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(value);
}

function trimField(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim().slice(0, MAX_FIELD_CHARS);
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Keeps a runaway transcript from reaching the database, without dropping the lead. */
function sanitiseConversation(value: unknown): Array<{ role: string; content: string }> {
  if (!Array.isArray(value)) return [];
  return value
    .filter((m): m is { role: unknown; content: unknown } => !!m && typeof m === 'object')
    .slice(0, MAX_MESSAGES)
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: typeof m.content === 'string' ? m.content.slice(0, MAX_CONTENT_CHARS) : '',
    }));
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')?.trim()
    // Every request arriving without a forwarding header shares one bucket.
    // Behind Vercel that header is always set; locally it is not.
    ?? 'unknown';
  if (isRateLimited(ip)) {
    return Response.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return Response.json({ ok: false, error: 'Payload too large' }, { status: 413 });
  }

  let body: LeadPayload;
  try {
    body = await request.json() as LeadPayload;
  } catch {
    // Previously this threw and surfaced as an opaque 500.
    return Response.json({ ok: false, error: 'Malformed request body' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') {
    return Response.json({ ok: false, error: 'Malformed request body' }, { status: 400 });
  }

  if (!looksLikeEmail(body.email)) {
    return Response.json({ ok: false, error: 'A valid email is required' }, { status: 400 });
  }

  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch {
    console.error('Supabase is not configured — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    return Response.json({ ok: false, error: 'Server not configured' }, { status: 500 });
  }

  const { error } = await supabaseAdmin.from('leads').insert({
    name: trimField(body.name),
    email: body.email.trim(),
    phone: trimField(body.phone),
    conversation: sanitiseConversation(body.conversation),
    build_type: trimField(body.buildType),
    answers: body.answers ?? {},
    effort_low: Number.isFinite(body.effortLow) ? body.effortLow : undefined,
    effort_high: Number.isFinite(body.effortHigh) ? body.effortHigh : undefined,
    channel: 'web',
    session_id: trimField(body.sessionId),
    // The reference the prospect sees and quotes back at us. Without it there
    // was no way to find "PB-XXXXXX" in this table.
    spec_id: trimField(body.specId),
  });

  if (error) {
    console.error('Supabase insert error:', error);
    return Response.json({ ok: false, error: 'Could not save your brief' }, { status: 500 });
  }

  return Response.json({ ok: true });
}
