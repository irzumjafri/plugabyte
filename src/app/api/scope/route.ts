import { BuildTypeId } from '@/lib/estimator';
import { BUILD_TYPE_IDS, ScopeReply, advancePastRepeats, scopingSystemPrompt, validateScopeReply } from '@/lib/scopeReply';

// Z.AI is OpenAI-compatible, so this is a plain fetch — no SDK needed.
//
// The GLM Coding Plan is served from /api/coding/paas/v4, NOT the standard
// /api/paas/v4: calling the latter on a coding subscription returns
// 1113 "Insufficient balance or no resource package" even with a valid key.
// Overridable so switching to pay-as-you-go credits needs no code change.
const ZAI_URL = (process.env.ZAI_BASE_URL ?? 'https://api.z.ai/api/coding/paas/v4')
  .replace(/\/$/, '') + '/chat/completions';
const MODEL = process.env.ZAI_MODEL ?? 'glm-4.6';
const TIMEOUT_MS = 20_000;
const MAX_TURNS = 40;
// Enough for one question plus options; the reply is small by design.
const MAX_TOKENS = 600;

export async function POST(request: Request) {
  const apiKey = process.env.ZAI_API_KEY ?? process.env.Z_AI_API_KEY;
  // No key is a supported state, not an error: the client falls back to the
  // deterministic question flow so the site still works.
  if (!apiKey) return Response.json({ status: 'unavailable' } satisfies ScopeReply);

  let body: { messages?: unknown; answers?: unknown; buildType?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Malformed request body' }, { status: 400 });
  }

  const history = Array.isArray(body.messages)
    ? body.messages
        .filter((m): m is { role: string; content: string } =>
          !!m && typeof m === 'object' && typeof (m as { content?: unknown }).content === 'string')
        .slice(-MAX_TURNS)
        .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content.slice(0, 2000) }))
    : [];

  const collected: Record<string, string> = {};
  if (body.answers && typeof body.answers === 'object') {
    for (const [k, v] of Object.entries(body.answers as Record<string, unknown>)) {
      if (typeof v === 'string') collected[k] = v.slice(0, 200);
    }
  }

  // The transcript goes in as one user message rather than as assistant turns.
  // Replaying prior questions as assistant messages taught the model that its
  // own output is a bare question string, and from turn two it stopped emitting
  // JSON at all — every follow-up failed to parse and fell back to the script.
  const transcript = history
    .map(m => `${m.role === 'user' ? 'Prospect' : 'You asked'}: ${m.content}`)
    .join('\n');
  const chosenType = BUILD_TYPE_IDS.includes(body.buildType as BuildTypeId)
    ? ` They already chose build type "${body.buildType}".`
    : '';
  const brief = [
    `Conversation so far:\n${transcript || '(nothing yet)'}`,
    `Answers already collected: ${JSON.stringify(collected)}.${chosenType}`,
    'Give the next step now, as a single JSON object and nothing else.',
  ].join('\n\n');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(ZAI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        // Left on, the plan's reasoning model spends the token budget on
        // reasoning_content and returns an empty `content`, which we would read
        // as a failure. This work needs a small JSON object, not deliberation.
        thinking: { type: 'disabled' },
        max_tokens: MAX_TOKENS,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: scopingSystemPrompt() },
          { role: 'user', content: brief },
        ],
      }),
    });

    if (!response.ok) {
      console.error('Z.AI error:', response.status, (await response.text()).slice(0, 300));
      return Response.json({ status: 'unavailable' } satisfies ScopeReply);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return Response.json({ status: 'unavailable' } satisfies ScopeReply);

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error('Z.AI returned non-JSON:', content.slice(0, 300));
      return Response.json({ status: 'unavailable' } satisfies ScopeReply);
    }

    const reply = validateScopeReply(parsed, collected);
    // Falling back is always better than showing a malformed question.
    if (!reply) return Response.json({ status: 'unavailable' } satisfies ScopeReply);
    const buildType = BUILD_TYPE_IDS.includes(body.buildType as BuildTypeId)
      ? (body.buildType as BuildTypeId)
      : undefined;
    // Questions we have already put to them, so a reworded repeat under a new
    // field id is still caught.
    const asked = history.filter(m => m.role === 'assistant').map(m => m.content);
    return Response.json(advancePastRepeats(reply, collected, buildType, asked));
  } catch (error) {
    console.error('Z.AI request failed:', error);
    return Response.json({ status: 'unavailable' } satisfies ScopeReply);
  } finally {
    clearTimeout(timer);
  }
}
