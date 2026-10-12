import { api } from '../../../../convex/_generated/api';
import { getConvex } from '@/lib/convex';

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
// keeps obvious junk out of the leads table. Move it to a shared store before
// this needs to hold across more than one server instance — Convex is already
// here, so that is the obvious place.
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

  try {
    await getConvex().mutation(api.leads.create, {
      email: body.email.trim(),
      name: trimField(body.name),
      phone: trimField(body.phone),
      conversation: sanitiseConversation(body.conversation),
      buildType: trimField(body.buildType),
      answers: body.answers ?? {},
      effortLow: Number.isFinite(body.effortLow) ? body.effortLow : undefined,
      effortHigh: Number.isFinite(body.effortHigh) ? body.effortHigh : undefined,
      sessionId: trimField(body.sessionId),
      // The reference the prospect sees and quotes back at us — without it a
      // quoted "PB-XXXXXX" could not be found.
      specId: trimField(body.specId),
    });
  } catch (error) {
    console.error('Convex lead insert failed:', error);
    return Response.json({ ok: false, error: 'Could not save your brief' }, { status: 500 });
  }

  return Response.json({ ok: true });
}
