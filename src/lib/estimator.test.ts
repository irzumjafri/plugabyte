import { describe, it, expect } from 'vitest';
import {
  BUILD_TYPES, classifyFreeText, branchQuestions, checkDisqualify, computeEffort,
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
    expect(result).toEqual({ low: 3, high: 5 });
  });

  it('bumps for systems, apis, approvers and deadline', () => {
    const result = computeEffort('integration', {
      systems: '4 or more', apis: 'No', approvers: '3 or more', deadline: 'Hard date',
    });
    // base 3-5, +2 systems, +2 apis, +1 approvers, +1 deadline = +6
    expect(result).toEqual({ low: 9, high: 11 });
  });

  it('always adds the AI eval-harness bump', () => {
    const result = computeEffort('ai', {});
    expect(result).toEqual({ low: 7, high: 9 });
  });

  it('bumps for screens and roles on product builds', () => {
    const result = computeEffort('product', { screens: '15+', roles: '4+' });
    // base 5-7, +3 screens, +2 roles = +5
    expect(result).toEqual({ low: 10, high: 12 });
  });
});
