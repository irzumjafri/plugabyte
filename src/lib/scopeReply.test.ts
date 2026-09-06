import { describe, it, expect } from 'vitest';
import { COMMON_FIELD_IDS, FIELDS, MAX_QUESTIONS, ScopeReply, advancePastRepeats, validateScopeReply } from './scopeReply';
import { branchQuestions, computeEffort } from './estimator';

describe('validateScopeReply', () => {
  it('rejects anything that is not a usable reply', () => {
    for (const junk of [null, undefined, 'nope', 42, {}, { status: 'chat' }]) {
      expect(validateScopeReply(junk)).toBeNull();
    }
  });

  it('rejects a done reply without a valid build type', () => {
    expect(validateScopeReply({ status: 'done', answers: {} })).toBeNull();
    expect(validateScopeReply({ status: 'done', buildType: 'mobile-app', answers: {} })).toBeNull();
  });

  it('rejects an ask reply missing a field or question', () => {
    expect(validateScopeReply({ status: 'ask', question: 'How many?' })).toBeNull();
    expect(validateScopeReply({ status: 'ask', field: 'systems', question: '   ' })).toBeNull();
  });

  // The estimator matches exact strings, so a paraphrase would score as nothing
  // while looking like a real answer. Dropping it keeps the band honest.
  it('drops answers the estimator cannot score', () => {
    const reply = validateScopeReply({
      status: 'done',
      buildType: 'integration',
      answers: { systems: 'two or three', apis: 'Yes', approvers: 'Just me' },
    });
    expect(reply).toEqual({
      status: 'done',
      buildType: 'integration',
      answers: { apis: 'Yes', approvers: 'Just me' },
    });
    // And the surviving answers are ones computeEffort actually reads.
    expect(computeEffort('integration', (reply as { answers: Record<string, string> }).answers))
      .toEqual(computeEffort('integration', { apis: 'Yes', approvers: 'Just me' }));
  });

  it('keeps exact option strings, including the en-dashes', () => {
    const reply = validateScopeReply({
      status: 'done',
      buildType: 'product',
      answers: { screens: '6–15', roles: '2–3' },
    });
    expect(reply).toMatchObject({ answers: { screens: '6–15', roles: '2–3' } });
    // Guards the thing that actually breaks: a hyphen instead of an en-dash.
    expect(validateScopeReply({ status: 'done', buildType: 'product', answers: { screens: '6-15' } }))
      .toEqual({ status: 'done', buildType: 'product', answers: {} });
  });

  it('overrides model-invented options with the canonical ones', () => {
    const reply = validateScopeReply({
      status: 'ask',
      field: 'apis',
      question: 'Can we reach those systems programmatically?',
      options: ['definitely', 'nope'],
    });
    expect(reply).toMatchObject({ status: 'ask', options: FIELDS.apis.options });
  });

  it('allows a free-text question the catalogue does not cover', () => {
    const reply = validateScopeReply({
      status: 'ask',
      field: 'payment_provider',
      question: 'Which payment provider is in play?',
    });
    expect(reply).toEqual({
      status: 'ask',
      field: 'payment_provider',
      question: 'Which payment provider is in play?',
      options: undefined,
      buildType: undefined,
    });
  });

  it('preserves answers already collected client-side', () => {
    const reply = validateScopeReply(
      { status: 'done', buildType: 'ai', answers: { apis: 'No' } },
      { systems: '4 or more' },
    );
    expect(reply).toMatchObject({ answers: { systems: '4 or more', apis: 'No' } });
  });
});

describe('advancePastRepeats', () => {
  it('leaves a fresh question alone', () => {
    const reply = { status: 'ask', field: 'systems', question: 'How many systems?' } as const;
    expect(advancePastRepeats(reply, { apis: 'Yes' }, 'rescue')).toBe(reply);
  });

  // Observed live: the model asked "what was it built with" twice in a row.
  it('replaces a repeated question with the next unanswered one', () => {
    const reply = { status: 'ask' as const, field: 'built_with', question: 'What was it built with?', buildType: 'rescue' as const };
    const advanced = advancePastRepeats(reply, { built_with: 'Hand-coded' }, 'rescue');
    expect(advanced).toMatchObject({ status: 'ask', field: 'systems' });
  });

  it('finishes when every canonical question is answered', () => {
    const collected = Object.fromEntries(branchQuestions('rescue').map(s => [s.id, s.options![0]]));
    const reply = { status: 'ask' as const, field: 'systems', question: 'again?', buildType: 'rescue' as const };
    expect(advancePastRepeats(reply, collected, 'rescue')).toEqual({
      status: 'done', buildType: 'rescue', answers: collected,
    });
  });

  it('cannot loop: repeated asks always consume a remaining question', () => {
    const collected: Record<string, string> = {};
    let guard = 0;
    let reply: ScopeReply = { status: 'ask', field: 'systems', question: 'q', buildType: 'rescue' };
    while (reply.status === 'ask' && guard++ < 20) {
      collected[reply.field] = 'x';
      reply = advancePastRepeats({ status: 'ask', field: reply.field, question: 'same again', buildType: 'rescue' }, collected, 'rescue');
    }
    expect(reply.status).toBe('done');
  });
});

describe('advancePastRepeats — text-level repeats and length cap', () => {
  // Observed live: the same question came back under a different field id, so an
  // id-only check let it through and the prospect was asked it twice.
  it('catches a repeat by question text even under a new field id', () => {
    const advanced = advancePastRepeats(
      { status: 'ask', field: 'ticket_volume', question: "Rough volume once it's live?", buildType: 'ai' },
      { surface: 'WhatsApp' },
      'ai',
      ["Rough volume once it's live?"],
    );
    expect(advanced).toMatchObject({ status: 'ask', field: 'volume' });
  });

  it('ignores punctuation and case when comparing questions', () => {
    const advanced = advancePastRepeats(
      { status: 'ask', field: 'x', question: 'ANY HARD DEADLINE', buildType: 'ai' },
      {},
      'ai',
      ['Any hard deadline?'],
    );
    expect(advanced).not.toMatchObject({ field: 'x' });
  });

  it('force-finishes once the interview runs long', () => {
    const advanced = advancePastRepeats(
      { status: 'ask', field: 'prior', question: 'One more thing?', buildType: 'ai' },
      { systems: 'Just one' },
      'ai',
      Array.from({ length: MAX_QUESTIONS }, (_, i) => `q${i}`),
    );
    expect(advanced).toMatchObject({ status: 'done', buildType: 'ai' });
  });

  it('lets a reworded catalogue question through untouched', () => {
    const reply = { status: 'ask', field: 'volume', question: 'Rough ticket volume on WhatsApp once live?', buildType: 'ai' } as const;
    expect(advancePastRepeats(reply, {}, 'ai', ['Any hard deadline?'])).toBe(reply);
  });

  it('replaces a bespoke field with the next catalogue question', () => {
    const advanced = advancePastRepeats(
      { status: 'ask', field: 'shop_platform', question: 'What does it connect to?', buildType: 'ai' },
      {},
      'ai',
      [],
    );
    expect(advanced).toMatchObject({ status: 'ask', field: 'surface' });
  });
});

describe('advancePastRepeats — off-branch questions', () => {
  // Observed live: it asked an AI agent how many screens it needed. computeEffort
  // bumps on `screens` regardless of build type, so that answer would have
  // silently added weeks to an agent build.
  it('rejects a field that belongs to a different build type', () => {
    const advanced = advancePastRepeats(
      { status: 'ask', field: 'screens', question: 'How many screens?', buildType: 'ai' },
      { surface: 'WhatsApp', volume: 'Under 100/day' },
      'ai',
      [],
    );
    expect(advanced).toMatchObject({ status: 'ask' });
    expect(branchQuestions('ai').map(s => s.id)).toContain((advanced as { field: string }).field);
    expect((advanced as { field: string }).field).not.toBe('screens');
  });

  it('still accepts a field that is in this build type', () => {
    const reply = { status: 'ask', field: 'screens', question: 'How many screens?', buildType: 'product' } as const;
    expect(advancePastRepeats(reply, {}, 'product', [])).toBe(reply);
  });
});

describe('advancePastRepeats — before the build type is known', () => {
  // Observed live: turn one asked an AI-agent prospect about screens. With no
  // type yet the union of fields was allowed, and computeEffort bumps on
  // `screens` for every type, so it inflated the band.
  it('only allows questions common to every build type', () => {
    const advanced = advancePastRepeats(
      { status: 'ask', field: 'screens', question: 'How many screens?' },
      {},
      undefined,
      [],
    );
    expect(COMMON_FIELD_IDS).not.toContain('screens');
    expect(advanced).toMatchObject({ status: 'ask' });
    expect(COMMON_FIELD_IDS).toContain((advanced as { field: string }).field);
  });

  it('lets a common question through before the type is known', () => {
    const reply = { status: 'ask', field: 'systems', question: 'What does it work with?' } as const;
    expect(advancePastRepeats(reply, {}, undefined, [])).toBe(reply);
  });

  it('never finishes without a build type', () => {
    const collected = Object.fromEntries(COMMON_FIELD_IDS.map(id => [id, 'x']));
    const advanced = advancePastRepeats(
      { status: 'ask', field: 'screens', question: 'How many screens?' },
      collected,
      undefined,
      Array.from({ length: MAX_QUESTIONS }, (_, i) => `q${i}`),
    );
    expect(advanced.status).not.toBe('done');
  });
});
