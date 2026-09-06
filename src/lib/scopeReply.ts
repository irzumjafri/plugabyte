import { BUILD_TYPES, BuildTypeId, Step, branchQuestions } from './estimator';

/** Beyond this the interview stops feeling like scoping and starts feeling like a form. */
export const MAX_QUESTIONS = 8;

const normalise = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * Keeps the interview moving, deterministically. Observed live, the model:
 *   - re-asked a field it already had, reworded ("what was it built with" twice);
 *   - invented an overlapping field, so the same question arrived under a new id
 *     and slipped past an id-only check ("Rough volume once it's live?" twice);
 *   - ran to 10 questions against a prompt asking for 5-7.
 *
 * Prompt rules did not fix any of these, so none of them are trusted to it. A
 * repeat — by field id OR by question text — is replaced with the next
 * unanswered canonical question, and the interview is force-finished once the
 * canonical set is covered or MAX_QUESTIONS is reached. Canonical phrasing
 * loses a little of the model's voice; asking the same thing twice loses trust.
 */
export function advancePastRepeats(
  reply: ScopeReply,
  collected: Record<string, string>,
  fallbackBuildType?: BuildTypeId,
  askedQuestions: string[] = [],
): ScopeReply {
  if (reply.status !== 'ask') return reply;

  const buildType = reply.buildType ?? fallbackBuildType;
  const alreadyAsked = askedQuestions.some(q => normalise(q) === normalise(reply.question));
  // Two ways a field can be wrong. Bespoke ones: given the freedom, the model
  // twice used it to re-ask a catalogue question in its own words, and
  // paraphrases slip past text matching. Off-branch ones: it asked an AI agent
  // how many *screens* it needed — and computeEffort bumps on `screens`
  // whatever the build type, so an irrelevant answer would have inflated the
  // estimate. Only this build type's own questions are accepted.
  const allowed = buildType
    ? new Set(branchQuestions(buildType).map(step => step.id))
    : new Set(COMMON_FIELD_IDS);
  const offCatalogue = !allowed.has(reply.field);
  const repeated = collected[reply.field] !== undefined || alreadyAsked || offCatalogue;
  const tooLong = askedQuestions.length >= MAX_QUESTIONS;

  if (!repeated && !tooLong) return reply;

  const branch = buildType
    ? branchQuestions(buildType)
    : COMMON_FIELD_IDS.map(id => FIELDS[id]);
  const next = branch.find(step => collected[step.id] === undefined);
  if (!buildType) {
    // Cannot finish without a type, so keep asking safe questions instead.
    return next
      ? { status: 'ask', field: next.id, question: next.prompt, options: next.options }
      : reply;
  }
  if (!next || tooLong) return { status: 'done', buildType, answers: collected };
  return {
    status: 'ask',
    field: next.id,
    question: next.prompt,
    options: next.options,
    buildType,
  };
}

/**
 * Every question the deterministic estimator knows how to read, unioned across
 * build types. The model chooses which to ask next and how to phrase it, but
 * recorded *values* have to come from here — `computeEffort` matches exact
 * strings ('2–3', '1,000+/day'), so a paraphrase would score as nothing.
 */
export const FIELDS: Record<string, Step> = (() => {
  const map: Record<string, Step> = {};
  for (const bt of BUILD_TYPES) {
    for (const step of branchQuestions(bt.id)) map[step.id] = step;
  }
  return map;
})();

export const BUILD_TYPE_IDS = BUILD_TYPES.map(b => b.id);

/**
 * Questions every build type asks. Before the type is known these are the only
 * safe ones: `screens` is meaningless for an agent, but `computeEffort` bumps on
 * it regardless, so asking it on turn one quietly added weeks to the estimate.
 */
export const COMMON_FIELD_IDS: string[] = BUILD_TYPES
  .map(bt => branchQuestions(bt.id).map(step => step.id))
  .reduce((shared, ids) => shared.filter(id => ids.includes(id)));

export type ScopeReply =
  | { status: 'ask'; field: string; question: string; options?: string[]; buildType?: BuildTypeId }
  | { status: 'done'; buildType: BuildTypeId; answers: Record<string, string> }
  | { status: 'unavailable' };

export function scopingSystemPrompt(): string {
  const catalogue = Object.entries(FIELDS)
    .map(([id, s]) => `- ${id}: "${s.prompt}"${s.options ? ` — allowed answers: ${s.options.map(o => `"${o}"`).join(', ')}` : ' — free text'}`)
    .join('\n');

  return `You are the scoping interviewer for Plugabyte, a software agency. You are talking to a prospect about a build they want.

Your job is to work out WHAT they are building and gather the facts needed to size it. You never estimate effort, time, cost or price — a deterministic function does that after you finish. Never mention weeks, days or money.

Build types (pick exactly one id): ${BUILD_TYPE_IDS.join(', ')}.

Questions you may ask, by field id:
${catalogue}

Who you are talking to:
- Assume a non-technical founder. They know their business, not software. Ask about what the thing does, who uses it, and what it has to work with — never about how it is built.
- Do not introduce technical vocabulary they have not used themselves. No "API", "endpoint", "integration", "schema", "webhook", "auth", "stack", "backend", "database", "deploy". Say "the tools you use", "pull data out of", "sign in", "go live".
- If they use technical terms first, match their level — mirror their vocabulary rather than talking down to them.

Rules:
- Ask ONE question at a time. Keep it to a single short sentence, in a direct British-English agency voice. No pleasantries, no "great question", no recapping what they said.
- Prefer a field from the catalogue. When you use one, its answer MUST be one of that field's allowed answers, so return those exact strings as "options".
- Skip fields that are irrelevant or already answered, and adapt the wording to what they told you.
- Only ever use a field id from the catalogue. Do not invent new ones. You may — and should — reword a catalogue question so it refers to what they actually told you.
- Aim to finish in 5-7 questions total. You must have "systems", "apis" and "approvers" before finishing.
- When you have enough, return status "done" with the build type and every answer you collected.

Reply with JSON only, no prose, in one of these shapes:
{"status":"ask","buildType":"<id or null>","field":"<field id>","question":"<the question>","options":["..."]}
{"status":"done","buildType":"<id>","answers":{"<field id>":"<answer>"}}`;
}

/**
 * Model output is untrusted input. Coerce it into something the estimator can
 * actually score, or reject it so the caller falls back to the scripted branch.
 */
export function validateScopeReply(raw: unknown, collected: Record<string, string> = {}): ScopeReply | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const buildType = BUILD_TYPE_IDS.includes(r.buildType as BuildTypeId)
    ? (r.buildType as BuildTypeId)
    : undefined;

  if (r.status === 'done') {
    if (!buildType) return null;
    const answers: Record<string, string> = { ...collected };
    if (r.answers && typeof r.answers === 'object') {
      for (const [k, v] of Object.entries(r.answers as Record<string, unknown>)) {
        if (typeof v !== 'string') continue;
        const field = FIELDS[k];
        // Drop values the estimator cannot score, rather than letting a
        // paraphrase ("two or three") silently count as nothing.
        if (field?.options && !field.options.includes(v)) continue;
        answers[k] = v.slice(0, 200);
      }
    }
    return { status: 'done', buildType, answers };
  }

  if (r.status === 'ask') {
    const field = typeof r.field === 'string' ? r.field.slice(0, 40) : '';
    const question = typeof r.question === 'string' ? r.question.trim().slice(0, 300) : '';
    if (!field || !question) return null;
    const known = FIELDS[field];
    // Canonical options win over whatever the model echoed back, so the answer
    // we store is always one the estimator recognises.
    const options = known?.options ?? (Array.isArray(r.options)
      ? r.options.filter((o): o is string => typeof o === 'string').slice(0, 6).map(o => o.slice(0, 60))
      : undefined);
    return { status: 'ask', field, question, options: options?.length ? options : undefined, buildType };
  }

  return null;
}
