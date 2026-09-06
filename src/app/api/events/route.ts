import { api } from '../../../../convex/_generated/api';
import { getConvex } from '@/lib/convex';

const MAX_NAME_CHARS = 64;
const MAX_PATH_CHARS = 256;

/**
 * Fire-and-forget event ingest. Analytics must never be able to break a page,
 * so every failure here answers 204 and is dropped.
 */
export async function POST(request: Request) {
  let body: { name?: unknown; sessionId?: unknown; path?: unknown; props?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 204 });
  }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, MAX_NAME_CHARS) : '';
  if (!name) return new Response(null, { status: 204 });

  try {
    await getConvex().mutation(api.events.track, {
      name,
      sessionId: typeof body.sessionId === 'string' ? body.sessionId.slice(0, 100) : undefined,
      path: typeof body.path === 'string' ? body.path.slice(0, MAX_PATH_CHARS) : undefined,
      props: body.props ?? undefined,
    });
  } catch (error) {
    console.error('Event track failed:', error);
  }
  return new Response(null, { status: 204 });
}
