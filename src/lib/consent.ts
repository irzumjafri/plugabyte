'use client';

import { useSyncExternalStore } from 'react';

/**
 * Analytics-cookie consent.
 *
 * GA4 sets cookies, so it must not run until someone has actually agreed.
 * The decision is stored per browser and read through useSyncExternalStore
 * rather than an effect: the server has no idea what a visitor chose, and
 * reading localStorage during render would mismatch hydration.
 */
export type Consent = 'granted' | 'denied';

const KEY = 'pb_consent';
const EVENT = 'pb-consent-change';

const listeners = new Set<() => void>();

function read(): Consent | null {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    // Private mode or blocked storage: treat as undecided rather than consented.
    return null;
  }
}

/** Cached so getSnapshot returns a stable value between changes. */
let snapshot: Consent | null = null;
let primed = false;

function getSnapshot(): Consent | null {
  if (!primed) {
    snapshot = read();
    primed = true;
  }
  return snapshot;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  const onChange = () => {
    snapshot = read();
    cb();
  };
  window.addEventListener(EVENT, onChange);
  // Another tab deciding should settle it here too.
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(cb);
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function setConsent(value: Consent): void {
  try {
    window.localStorage.setItem(KEY, value);
  } catch {
    /* the in-memory snapshot below still takes effect for this page */
  }
  snapshot = value;
  primed = true;
  window.dispatchEvent(new Event(EVENT));
}

/** null means "not asked yet" — the banner shows and nothing is loaded. */
export function useConsent(): Consent | null {
  // The server render must not guess: it always sees "undecided".
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
