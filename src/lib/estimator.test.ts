import { describe, it, expect } from 'vitest';
import {
  BUILD_TYPES, type BuildTypeId, classifyFreeText, branchQuestions, assumptionsFor, checkDisqualify, computeEffort, fillUnknowns, specId,
} from './estimator';

describe('classifyFreeText', () => {
  it('classifies a clear match', () => {
    const result = classifyFreeText('we need a chatbot agent for support');
    expect(result).toEqual({ status: 'clear', type: 'ai' });
  });

  it('flags an ambiguous phrase matching two build types closely', () => {
    const result = classifyFreeText('sync data between our crm and warehouse');
    expect(result.status).toBe('ambiguous');
  });

  it('returns vague when nothing matches', () => {
    const result = classifyFreeText('something cool');
    expect(result).toEqual({ status: 'vague' });
  });

  // Substring matching used to score these as AI ("retail", "email", "detail")
  // and as an integration ("rapid" -> api), so real sentences came back
  // ambiguous and the conversation bailed out to booking a call.
  it('does not match a keyword buried inside a longer word', () => {
    expect(classifyFreeText('a retail app for our customers')).toEqual({ status: 'clear', type: 'product' });
    expect(classifyFreeText('an email pipeline that stops dropping rows')).toEqual({ status: 'clear', type: 'pipeline' });
    expect(classifyFreeText('rapid prototype cleanup')).toEqual({ status: 'clear', type: 'rescue' });
  });

  it('still matches plurals and inflections', () => {
    expect(classifyFreeText('a dashboard for our ops team')).toEqual({ status: 'clear', type: 'internal' });
    expect(classifyFreeText('integrated with zapier and a webhook')).toEqual({ status: 'clear', type: 'integration' });
  });

  it('reads a curly apostrophe the way a phone types it', () => {
    expect(classifyFreeText('the prototype doesn’t work in production')).toEqual({ status: 'clear', type: 'rescue' });
  });
});

describe('specId', () => {
  it('does not collide at realistic volume', () => {
    // Probabilistic, so assert a bound rather than perfection: 32^6 expects
    // ~0.2 collisions here. PB-#### produced ~190 collisions in only 2,000.
    const ids = new Set(Array.from({ length: 20000 }, () => specId()));
    expect(ids.size).toBeGreaterThan(19990);
  });

  it('avoids characters that are misheard when read aloud', () => {
    const ids = Array.from({ length: 500 }, () => specId());
    for (const id of ids) expect(id).toMatch(/^PB-[0-9A-HJKMNP-TV-Z]{6}$/);
  });
});

describe('branchQuestions', () => {
  it('includes AI-specific questions for the ai build type', () => {
    const steps = branchQuestions('ai');
    expect(steps.map(s => s.id)).toContain('surface');
    expect(steps.map(s => s.id)).toContain('volume');
  });

  it('includes screens/roles questions for product and internal', () => {
    for (const type of ['product', 'internal'] as const) {
      const steps = branchQuestions(type);
      expect(steps.map(s => s.id)).toContain('screens');
      expect(steps.map(s => s.id)).toContain('roles');
    }
  });

  it('includes built_with question for rescue', () => {
    const steps = branchQuestions('rescue');
    expect(steps.map(s => s.id)).toContain('built_with');
  });

  it('falls back to common questions for pipeline and integration', () => {
    const steps = branchQuestions('pipeline');
    expect(steps.map(s => s.id)).toEqual(['systems', 'apis', 'approvers', 'deadline', 'prior']);
  });

  it('covers every build type without throwing', () => {
    for (const bt of BUILD_TYPES) {
      expect(() => branchQuestions(bt.id)).not.toThrow();
    }
  });
});

describe('checkDisqualify', () => {
  it('disqualifies the weekend-tool case for integration', () => {
    const result = checkDisqualify('integration', { systems: '2–3', apis: 'Yes', approvers: 'Just me' });
    expect(result.disqualified).toBe(true);
    expect(result.reason).toMatch(/weekend/);
  });

  it('disqualifies the weekend-tool case for pipeline', () => {
    const result = checkDisqualify('pipeline', { systems: 'Just one', apis: 'Yes', approvers: 'Just me' });
    expect(result.disqualified).toBe(true);
  });

  it('does not disqualify when systems are complex', () => {
    const result = checkDisqualify('integration', { systems: '4 or more', apis: 'Yes', approvers: 'Just me' });
    expect(result.disqualified).toBe(false);
  });

  it('does not disqualify non-integration/pipeline build types', () => {
    const result = checkDisqualify('product', { systems: '2–3', apis: 'Yes', approvers: 'Just me' });
    expect(result.disqualified).toBe(false);
  });

  it('does not disqualify without APIs', () => {
    const result = checkDisqualify('integration', { systems: '2–3', apis: 'No', approvers: 'Just me' });
    expect(result.disqualified).toBe(false);
  });
});

describe('computeEffort', () => {
  it('returns the base band with no bumps', () => {
    const result = computeEffort('internal', {});
    expect(result).toEqual({ low: 2, high: 6 });
  });

  it('bumps for systems, apis, approvers and deadline', () => {
    const result = computeEffort('integration', {
      systems: '4 or more', apis: 'No', approvers: '3 or more', deadline: 'Hard date',
    });
    // base 2-6, +1 systems, +1 apis, +1 approvers, +1 deadline = +4
    expect(result).toEqual({ low: 6, high: 10 });
  });

  it('always adds the AI eval-harness bump', () => {
    const result = computeEffort('ai', {});
    expect(result).toEqual({ low: 4, high: 8 });
  });

  it('bumps for screens and roles on product builds', () => {
    const result = computeEffort('product', { screens: '15+', roles: '4+' });
    // base 4-8, +2 screens, +1 roles = +3
    expect(result).toEqual({ low: 7, high: 11 });
  });
});

// The site shows both numbers, so they have to agree: a typical quote's upper
// bound cannot sit under the case study for the same build type.
describe('quoted bands vs published case studies', () => {
  const PUBLISHED: Partial<Record<BuildTypeId, number>> = {
    ai: 7, integration: 4, product: 9, rescue: 3,
  };

  it('reaches the effort our own case studies report', () => {
    for (const [type, weeks] of Object.entries(PUBLISHED) as [BuildTypeId, number][]) {
      const { answers } = fillUnknowns(type, {});
      const { high } = computeEffort(type, answers);
      // One week of tolerance: 4-8 against a published 9 reads as consistent,
      // where the old 3-5 against 9 read as the site contradicting itself.
      expect(
        high,
        `${type}: quote tops out at ${high}w but /work publishes ${weeks}w`,
      ).toBeGreaterThanOrEqual(weeks - 1);
    }
  });
});

describe('fillUnknowns', () => {
  it('leaves answers we actually have alone', () => {
    const { answers, assumed } = fillUnknowns('integration', { systems: '4 or more', apis: 'No' });
    expect(answers.systems).toBe('4 or more');
    expect(answers.apis).toBe('No');
    expect(assumed.every(a => !a.includes('two or three systems'))).toBe(true);
  });

  // Unasked fields used to be worth zero, which quietly made every short
  // conversation cheaper than a long one about the same build.
  it('never estimates lower than asking would have', () => {
    const asked = computeEffort('product', { systems: '2–3', apis: 'Not sure', approvers: '2', deadline: 'None', screens: '6–15', roles: '2–3' });
    const { answers } = fillUnknowns('product', {});
    expect(computeEffort('product', answers)).toEqual(asked);
    expect(computeEffort('product', answers).low).toBeGreaterThanOrEqual(computeEffort('product', {}).low);
  });

  it('only fills fields this build type actually asks', () => {
    const { answers } = fillUnknowns('ai', {});
    expect(answers.volume).toBeDefined();   // ai asks volume
    expect(answers.screens).toBeUndefined(); // ai never asks screens
  });

  it('reports what it had to guess', () => {
    const { assumed } = fillUnknowns('rescue', { systems: 'Just one' });
    expect(assumed.length).toBeGreaterThan(0);
    expect(assumed.some(a => a.includes('sign off'))).toBe(true);
  });

  // apis is still filled so it scores, but assumptionsFor already explains an
  // unconfirmed answer — adding a second line said the same thing twice.
  it('does not duplicate an assumption assumptionsFor already makes', () => {
    const { answers, assumed } = fillUnknowns('rescue', {});
    expect(answers.apis).toBe('Not sure');
    const combined = [...assumptionsFor('rescue', answers), ...assumed];
    const unconfirmed = combined.filter(a => a.toLowerCase().includes('unconfirmed'));
    expect(unconfirmed).toHaveLength(1);
  });
});
