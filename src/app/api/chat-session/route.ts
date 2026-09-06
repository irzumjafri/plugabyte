import { api } from '../../../../convex/_generated/api';
import { getConvex } from '@/lib/convex';

const MAX_MESSAGES = 200;
const MAX_CONTENT_CHARS = 4000;

/**
 * Records the running transcript, including conversations nobody submits —
 * which is most of them, and the only place the funnel's drop-off is visible.
 * No contact details pass through here; those only exist on a submitted lead.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 204 });
  }

  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.slice(0, 100) : '';
  if (!sessionId) return new Response(null, { status: 204 });

  const messages = Array.isArray(body.messages)
    ? body.messages
        .filter((m): m is { role: unknown; content: unknown } => !!m && typeof m === 'object')
        .slice(0, MAX_MESSAGES)
        .map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: typeof m.content === 'string' ? m.content.slice(0, MAX_CONTENT_CHARS) : '',
        }))
    : [];

  try {
    await getConvex().mutation(api.chat.record, {
      sessionId,
      messages,
      answers: body.answers ?? {},
      buildType: typeof body.buildType === 'string' ? body.buildType : undefined,
      outcome: typeof body.outcome === 'string' ? body.outcome : undefined,
      specId: typeof body.specId === 'string' ? body.specId : undefined,
      effortLow: typeof body.effortLow === 'number' ? body.effortLow : undefined,
      effortHigh: typeof body.effortHigh === 'number' ? body.effortHigh : undefined,
      aiDriven: typeof body.aiDriven === 'boolean' ? body.aiDriven : undefined,
      questionCount: typeof body.questionCount === 'number' ? body.questionCount : undefined,
    });
  } catch (error) {
    console.error('Chat session record failed:', error);
  }
  return new Response(null, { status: 204 });
}
