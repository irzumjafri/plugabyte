import { BUILD_TYPES, BuildTypeId, Step, branchQuestions } from './estimator';

/** Four is the brief. Past that it reads as an intake form, which is the thing we removed. */
export const MAX_QUESTIONS = 4;

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
  // Bespoke fields are the point now — the model asks about the business, not
  // from a catalogue — so only genuine repeats are replaced. Scoring values are
  // filtered separately, in scoringValues, which is what keeps an off-branch
  // guess (screens on an AI agent) out of the estimate.
  const repeated = collected[reply.field] !== undefined || alreadyAsked;
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
  | {
      status: 'ask';
      field: string;
      question: string;
      options?: string[];
      buildType?: BuildTypeId;
      /** One short clause reacting to their last answer, shown before the question. */
      reflection?: string;
      /** Scoping values the model worked out rather than asked for. */
      inferred?: Record<string, string>;
    }
  | { status: 'done'; buildType: BuildTypeId; answers: Record<string, string> }
  | { status: 'unavailable' };

export function scopingSystemPrompt(): string {
  const catalogue = Object.entries(FIELDS)
    .map(([id, s]) => `- ${id}: ${s.options ? s.options.map(o => `"${o}"`).join(' | ') : 'free text'}`)
    .join('\n');

  return `You are scoping a build for Plugabyte, a software agency, talking to the founder who wants it.

This is a conversation, not an intake form. You are the experienced person on the call who already knows what to look for and only asks what they cannot work out for themselves.

Who you are talking to:
- A non-technical founder. They know their business, not software.
- Never introduce vocabulary they have not used: no "API", "endpoint", "integration", "schema", "webhook", "auth", "stack", "backend", "database", "deploy".
- If they use technical terms first, match their level.

What to ask about:
- Their business and the problem: what breaks today, what it costs them, what "working" would look like, who touches it.
- NOT their procurement process. Never ask how many people sign off, whether there is a deadline, or whether someone tried before. Those are sales questions and they make us sound like we are qualifying them.

How to behave:
- Ask AT MOST 4 questions in total, then finish. Fewer is better.
- One question at a time, one short sentence.
- Before each question after the first, react to what they just said in one short clause — something that shows you understood or spotted the real issue. Put it in "reflection". Do not flatter, do not recap.
- Offer options in "options" when a small set genuinely covers it, so they can tap rather than type. Otherwise omit it and let them answer freely.

Working out the estimate:
- While you talk, infer these scoping values from what they tell you and return them in "inferred". Use ONLY the exact allowed strings:
${catalogue}
- Infer only what you can genuinely support from what they said. Leave the rest out — we assume a sensible default and tell them we did. Guessing wrong is worse than leaving it blank.
- Never mention effort, weeks, days, timelines or money. A deterministic function does that after you finish.
- Build types (pick exactly one id): ${BUILD_TYPE_IDS.join(', ')}.

Reply with JSON only, no prose, in one of these shapes:
{"status":"ask","buildType":"<id or null>","field":"<short_snake_case_id>","reflection":"<one short clause, or omit on the first question>","question":"<the question>","options":["..."],"inferred":{"<field id>":"<allowed value>"}}
{"status":"done","buildType":"<id>","answers":{"<field id>":"<allowed value>"}}`;
}

/**
 * Keeps only values the estimator can actually score. Inference is the model's
 * job now, so this is the line between "it worked it out" and "it made it up":
 * anything outside a field's allowed strings is dropped rather than stored.
 */
function scoringValues(raw: unknown, buildType?: BuildTypeId): Record<string, string> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  // computeEffort bumps on `screens` for every build type, so an inferred
  // screen count on an AI agent would inflate it. Only this build type's own
  // fields can score; before the type is known, only the shared ones can.
  const scorable = new Set(
    buildType ? branchQuestions(buildType).map(step => step.id) : COMMON_FIELD_IDS
  );
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v !== 'string' || !scorable.has(k)) continue;
    const field = FIELDS[k];
    if (!field?.options || !field.options.includes(v)) continue;
    out[k] = v;
  }
  return Object.keys(out).length > 0 ? out : undefined;
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
    // Free-text answers are kept as context for the call; only catalogue values
    // that belong to this build type are allowed to move the estimate.
    const answers: Record<string, string> = { ...collected };
    if (r.answers && typeof r.answers === 'object') {
      for (const [k, v] of Object.entries(r.answers as Record<string, unknown>)) {
        if (typeof v !== 'string') continue;
        if (FIELDS[k]) continue; // handled by scoringValues below
        answers[k] = v.slice(0, 200);
      }
      Object.assign(answers, scoringValues(r.answers, buildType) ?? {});
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
    const reflection = typeof r.reflection === 'string' && r.reflection.trim()
      ? r.reflection.trim().slice(0, 200)
      : undefined;
    return {
      status: 'ask',
      field,
      question,
      options: options?.length ? options : undefined,
      buildType,
      reflection,
      inferred: scoringValues(r.inferred, buildType),
    };
  }

  return null;
}
