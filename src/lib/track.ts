const SESSION_KEY = 'pb_session';
let memorySessionId: string | null = null;

/**
 * One id per browser tab, shared by page views, the chat and the lead — without
 * it the funnel cannot be followed from landing to brief. sessionStorage is
 * per-tab and cleared on close; private mode can refuse it, hence the fallback.
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const stored = window.sessionStorage.getItem(SESSION_KEY);
    if (stored) return stored;
    const fresh = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_KEY, fresh);
    return fresh;
  } catch {
    if (!memorySessionId) memorySessionId = crypto.randomUUID();
    return memorySessionId;
  }
}

/**
 * Client-side analytics. Every call is fire-and-forget and swallows its own
 * errors: recording that something happened must never break the thing that
 * happened.
 */
export function trackEvent(name: string, props?: Record<string, unknown>, sessionId?: string): void {
  if (typeof window === 'undefined') return;
  sessionId = sessionId || getSessionId();
  void fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, props, sessionId, path: window.location.pathname }),
    keepalive: true, // still sends if the tab is closing
  }).catch(() => {});
}

export interface ChatSessionSnapshot {
  sessionId: string;
  messages: Array<{ role: string; content: string }>;
  answers: Record<string, string>;
  buildType?: string;
  outcome?: string;
  specId?: string;
  effortLow?: number;
  effortHigh?: number;
  aiDriven?: boolean;
  questionCount?: number;
}

export function recordChatSession(snapshot: ChatSessionSnapshot): void {
  if (typeof window === 'undefined') return;
  void fetch('/api/chat-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(snapshot),
    keepalive: true,
  }).catch(() => {});
}
