// Plugabyte scoping rules — pure functions, no DOM, no LLM.
// The conversation is model-driven (see src/lib/scopeReply.ts), but everything
// here is deterministic: code computes effort, never a model.

export type BuildTypeId = 'product' | 'internal' | 'ai' | 'pipeline' | 'integration' | 'rescue';

export interface BuildType {
  id: BuildTypeId;
  label: string;
  blurb: string;
}

export const BUILD_TYPES: BuildType[] = [
  { id: 'product', label: 'Product build', blurb: 'A new product or customer-facing app' },
  { id: 'internal', label: 'Internal tool', blurb: 'Something your own team runs on' },
  { id: 'ai', label: 'AI agent', blurb: 'A model doing real work, not a demo' },
  { id: 'pipeline', label: 'Data pipeline', blurb: 'Moving and shaping data on a schedule' },
  { id: 'integration', label: 'Automation & integration', blurb: 'Two systems that should be one workflow' },
  { id: 'rescue', label: 'Prototype rescue', blurb: "Something exists and it isn't production-ready" },
];

const KEYWORDS: Record<BuildTypeId, string[]> = {
  product: ['app', 'product', 'customer', 'saas', 'platform', 'signup', 'users'],
  internal: ['internal', 'dashboard', 'ops', 'admin', 'team tool', 'back office'],
  ai: ['ai', 'agent', 'chatbot', 'llm', 'gpt', 'model', 'assistant', 'whatsapp bot'],
  pipeline: ['pipeline', 'etl', 'data', 'database', 'warehouse', 'sync data', 'reporting'],
  integration: ['integrate', 'integration', 'zapier', 'sync', 'connect', 'crm', 'webhook', 'api'],
  rescue: ['broken', 'rescue', 'bolt', 'lovable', 'v0', 'replit', 'prototype', 'demo fell over', 'production-ready', "doesn't work"],
};

/**
 * Keywords have to start on a word boundary. Matching them as bare substrings
 * classified "retail", "email" and "detail" as AI, and "rapid" as an API
 * integration — so ordinary sentences came back ambiguous and the conversation
 * bailed to "let's get on a call".
 *
 * Trailing inflections are allowed so "customers" and "integrated" still match,
 * but only real ones — an open-ended wildcard let "product" match "production",
 * which is the opposite build type. Short keywords ("ai", "api", "ops") take a
 * plural "s" only, so "ai" cannot match "aim" or "aid".
 */
const MATCHERS: Record<BuildTypeId, RegExp[]> = Object.fromEntries(
  (Object.entries(KEYWORDS) as [BuildTypeId, string[]][]).map(([id, words]) => [
    id,
    words.map(w => {
      const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const tail = w.length >= 4 ? '(?:s|es|d|ed|ing)?' : 's?';
      return new RegExp(`(?<![\\p{L}\\d])${escaped}${tail}(?![\\p{L}\\d])`, 'u');
    }),
  ])
) as Record<BuildTypeId, RegExp[]>;

export type Classification =
  | { status: 'clear'; type: BuildTypeId }
  | { status: 'ambiguous'; a: BuildTypeId; b: BuildTypeId }
  | { status: 'vague' };

export function classifyFreeText(text: string): Classification {
  // Curly apostrophes are what phones type, and "doesn't work" would miss them.
  const t = text.toLowerCase().replace(/[‘’]/g, "'");
  const scores = (Object.entries(MATCHERS) as [BuildTypeId, RegExp[]][])
    .map(([id, res]) => ({ id, score: res.reduce((n, re) => n + (re.test(t) ? 1 : 0), 0) }))
    .sort((a, b) => b.score - a.score);

  const top = scores[0];
  const second = scores[1];
  if (top.score === 0) return { status: 'vague' };
  if (second.score > 0 && second.score >= top.score - 1) {
    return { status: 'ambiguous', a: top.id, b: second.id };
  }
  return { status: 'clear', type: top.id };
}

export type StepKind = 'chips' | 'text';

export interface Step {
  id: string;
  prompt: string;
  kind: StepKind;
  options?: string[];
}

export function branchQuestions(typeId: BuildTypeId): Step[] {
  const common: Step[] = [
    { id: 'systems', prompt: 'How many other tools does this need to work with?', kind: 'chips', options: ['Just one', '2–3', '4 or more'] },
    { id: 'apis', prompt: 'Do those tools let other software pull data out of them?', kind: 'chips', options: ['Yes', 'No', 'Not sure'] },
    { id: 'approvers', prompt: 'How many people need to say yes before this goes live?', kind: 'chips', options: ['Just me', '2', '3 or more'] },
    { id: 'deadline', prompt: 'Is there a date this has to be ready by?', kind: 'chips', options: ['None', 'Soft target', 'Hard date'] },
    { id: 'prior', prompt: 'Has anyone tried building this already?', kind: 'chips', options: ['No, starting fresh', 'Yes, and it failed', 'Yes, abandoned mid-build'] },
  ];
  if (typeId === 'ai') {
    return [
      { id: 'surface', prompt: 'Where do people talk to it?', kind: 'chips', options: ['Chat widget', 'WhatsApp', 'Internal only', 'Voice'] },
      { id: 'volume', prompt: 'Roughly how many of those a day, once it is live?', kind: 'chips', options: ['Under 100/day', '100–1,000/day', '1,000+/day'] },
      ...common,
    ];
  }
  if (typeId === 'product' || typeId === 'internal') {
    return [
      { id: 'screens', prompt: 'Roughly how many screens or pages does it need?', kind: 'chips', options: ['1–5', '6–15', '15+'] },
      { id: 'roles', prompt: 'How many different kinds of user, each seeing something different?', kind: 'chips', options: ['1', '2–3', '4+'] },
      ...common,
    ];
  }
  if (typeId === 'rescue') {
    return [
      { id: 'built_with', prompt: 'What was it built with?', kind: 'chips', options: ['AI builder (Bolt/Lovable/v0)', 'Hand-coded', 'Not sure'] },
      ...common,
    ];
  }
  return common; // pipeline, integration
}

export type Answers = Record<string, string>;

export interface DisqualifyResult {
  disqualified: boolean;
  reason?: string;
}

export function checkDisqualify(typeId: BuildTypeId, answers: Answers): DisqualifyResult {
  const easySystems = answers.systems === 'Just one' || answers.systems === '2–3';
  const hasApis = answers.apis === 'Yes';
  const lightApproval = answers.approvers === 'Just me';
  if ((typeId === 'integration' || typeId === 'pipeline') && easySystems && hasApis && lightApproval) {
    return {
      disqualified: true,
      reason: "Honestly, this one is within reach on your own — a couple of tools that already share their data, and one person deciding, is usually a weekend on something off-the-shelf like Zapier, Make or n8n. Plenty of people get there themselves. If you would rather it was just done, and done properly, we are happy to take it on.",
    };
  }
  return { disqualified: false };
}

const BASE_WEEKS: Record<BuildTypeId, number> = {
  product: 5, internal: 3, ai: 6, pipeline: 4, integration: 3, rescue: 2,
};

export interface EffortResult {
  low: number;
  high: number;
}

export function computeEffort(typeId: BuildTypeId, answers: Answers): EffortResult {
  let low = BASE_WEEKS[typeId] ?? 4;
  let high = low + 2;
  const bump = (n: number) => { low += n; high += n; };

  if (answers.systems === '4 or more') bump(2);
  else if (answers.systems === '2–3') bump(1);
  if (answers.apis === 'No') bump(2);
  if (answers.apis === 'Not sure') bump(1);
  if (answers.approvers === '3 or more') bump(1);
  if (answers.deadline === 'Hard date') bump(1);
  if (answers.screens === '15+') bump(3);
  else if (answers.screens === '6–15') bump(1);
  if (answers.roles === '4+') bump(2);
  if (answers.volume === '1,000+/day') bump(2);
  if (typeId === 'ai') bump(1); // eval harness + grounding, always present

  return { low, high };
}

// Crockford-style alphabet: no I, L, O, U, so nothing is misheard on a call or
// mistyped from a screenshot.
const SPEC_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * A prospect quotes this back at us, so it has to be unique in practice.
 * The old PB-#### drew from 9,000 values: 2,000 specs produced ~190 collisions.
 * 32^6 is ~1.07e9, which keeps collisions negligible at any volume this site
 * will see, and stays short enough to read aloud.
 */
/**
 * What we assume when a question was never asked. computeEffort only ever adds,
 * so an unknown field silently makes a build look cheaper than it is — which is
 * the wrong direction to be wrong in. These are mid-range, not optimistic, and
 * every one of them is surfaced to the reader as an assumption.
 */
const UNKNOWN_DEFAULTS: Record<string, { value: string; assumption: string }> = {
  systems: { value: '2–3', assumption: 'Assumes this touches two or three systems — worth confirming, it moves the number.' },
  // No assumption line: assumptionsFor already explains an unconfirmed 'Not sure'.
  apis: { value: 'Not sure', assumption: '' },
  approvers: { value: '2', assumption: 'Assumes a couple of people sign off rather than a committee.' },
  deadline: { value: 'None', assumption: 'Assumes no fixed launch date. A hard date adds time, it does not remove it.' },
  screens: { value: '6–15', assumption: 'Assumes a mid-sized surface, roughly six to fifteen screens.' },
  roles: { value: '2–3', assumption: 'Assumes two or three kinds of user.' },
  volume: { value: '100–1,000/day', assumption: 'Assumes hundreds a day rather than thousands.' },
};

export interface FilledAnswers {
  answers: Answers;
  /** Lines to show the reader, one per field we had to assume. */
  assumed: string[];
}

/** Fills anything the conversation never established, for this build type only. */
export function fillUnknowns(typeId: BuildTypeId, answers: Answers): FilledAnswers {
  const filled: Answers = { ...answers };
  const assumed: string[] = [];
  for (const step of branchQuestions(typeId)) {
    if (filled[step.id] !== undefined) continue;
    const fallback = UNKNOWN_DEFAULTS[step.id];
    if (!fallback) continue;
    filled[step.id] = fallback.value;
    if (fallback.assumption) assumed.push(fallback.assumption);
  }
  return { answers: filled, assumed };
}

export function specId(): string {
  const bytes = new Uint8Array(6);
  const cryptoObj = globalThis.crypto;
  if (cryptoObj?.getRandomValues) cryptoObj.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);

  let out = '';
  for (const b of bytes) out += SPEC_ALPHABET[b % SPEC_ALPHABET.length];
  return 'PB-' + out;
}

export function assumptionsFor(typeId: BuildTypeId, answers: Answers): string[] {
  const a = ['Effort excludes rate-card pricing — discussed on the call.'];
  if (typeId === 'ai') a.push('Includes eval harness, prompt/version management, human handoff path and cost modelling at stated volume.');
  if (answers.apis === 'No') a.push('At least one of those tools will not share its data directly — expect a workaround or a call with the vendor.');
  if (answers.apis === 'Not sure') a.push('Whether those tools will share their data is unconfirmed — the first week includes a check.');
  if (answers.approvers === '3 or more') a.push("Multiple approvers add review cycles that aren't build time but do add calendar time.");
  a.push('Assumes we get access to a test version of your systems in the first week.');
  return a;
}
