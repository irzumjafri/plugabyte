import { describe, it, expect } from 'vitest';
import { classify } from './attribution';

const q = (s: string) => new URLSearchParams(s);

describe('classify', () => {
  it('reads a tagged campaign in preference to the referrer', () => {
    const a = classify('https://www.google.com/', q('utm_source=newsletter&utm_medium=email&utm_campaign=launch'), '/');
    expect(a).toMatchObject({ channel: 'email', source: 'newsletter', campaign: 'launch' });
  });

  it('separates organic search from an ordinary referral', () => {
    expect(classify('https://www.google.com/search?q=x', q(''), '/').channel).toBe('organic');
    expect(classify('https://news.ycombinator.com/', q(''), '/').channel).toBe('referral');
  });

  it('treats a missing or unparseable referrer as direct', () => {
    expect(classify('', q(''), '/').channel).toBe('direct');
    expect(classify('not a url', q(''), '/').channel).toBe('direct');
  });

  // "google.com.evil.example" must not be counted as Google traffic.
  it('does not match a search engine name inside another domain', () => {
    expect(classify('https://google.com.evil.example/', q(''), '/').channel).toBe('referral');
  });

  it('keeps the landing page, which is the page search actually ranked', () => {
    expect(classify('https://duckduckgo.com/', q(''), '/rescue').landing).toBe('/rescue');
  });
});
