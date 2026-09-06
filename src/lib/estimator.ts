// Plugabyte scoping-conversation engine — pure functions, no DOM, no LLM.
// Deterministic: code computes effort, never a model.

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
  pipeline: ['pipeline', 'etl', 'data', 'warehouse', 'sync data', 'reporting'],
  integration: ['integrate', 'integration', 'zapier', 'sync', 'connect', 'crm', 'webhook', 'api'],
  rescue: ['broken', 'rescue', 'bolt', 'lovable', 'v0', 'replit', 'prototype', 'demo fell over', 'production-ready', "doesn't work"],
};

export type Classification =
  | { status: 'clear'; type: BuildTypeId }
  | { status: 'ambiguous'; a: BuildTypeId; b: BuildTypeId }
  | { status: 'vague' };

export function classifyFreeText(text: string): Classification {
  const t = text.toLowerCase();
  const scores = (Object.entries(KEYWORDS) as [BuildTypeId, string[]][])
    .map(([id, words]) => ({ id, score: words.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0) }))
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
    { id: 'systems', prompt: 'How many systems does this touch?', kind: 'chips', options: ['Just one', '2–3', '4 or more'] },
    { id: 'apis', prompt: 'Do the systems you need to reach have public APIs?', kind: 'chips', options: ['Yes', 'No', 'Not sure'] },
    { id: 'approvers', prompt: 'How many people need to sign off before this ships?', kind: 'chips', options: ['Just me', '2', '3 or more'] },
    { id: 'deadline', prompt: 'Any hard deadline?', kind: 'chips', options: ['None', 'Soft target', 'Hard date'] },
    { id: 'prior', prompt: 'Has someone already tried building this?', kind: 'chips', options: ['No, starting fresh', 'Yes, and it failed', 'Yes, abandoned mid-build'] },
  ];
  if (typeId === 'ai') {
    return [
      { id: 'surface', prompt: 'Where does the agent show up?', kind: 'chips', options: ['Chat widget', 'WhatsApp', 'Internal only', 'Voice'] },
      { id: 'volume', prompt: "Rough volume once it's live?", kind: 'chips', options: ['Under 100/day', '100–1,000/day', '1,000+/day'] },
      ...common,
    ];
  }
  if (typeId === 'product' || typeId === 'internal') {
    return [
      { id: 'screens', prompt: 'Roughly how many screens?', kind: 'chips', options: ['1–5', '6–15', '15+'] },
      { id: 'roles', prompt: 'How many distinct user roles need their own permissions?', kind: 'chips', options: ['1', '2–3', '4+'] },
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
      reason: "Two systems with APIs and one approver — that's a weekend on an off-the-shelf tool (Zapier, Make, n8n), not an agency engagement.",
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

export function specId(): string {
  return 'PB-' + (1000 + Math.floor(Math.random() * 9000));
}

export function assumptionsFor(typeId: BuildTypeId, answers: Answers): string[] {
  const a = ['Effort excludes rate-card pricing — discussed on the call.'];
  if (typeId === 'ai') a.push('Includes eval harness, prompt/version management, human handoff path and cost modelling at stated volume.');
  if (answers.apis === 'No') a.push('No public API on at least one system — expect scraping or a vendor call to unblock.');
  if (answers.apis === 'Not sure') a.push('API access unconfirmed — first week includes a spike to verify reachability.');
  if (answers.approvers === '3 or more') a.push("Multiple approvers add review cycles that aren't build time but do add calendar time.");
  a.push('Assumes access to a staging environment within the first week.');
  return a;
}
