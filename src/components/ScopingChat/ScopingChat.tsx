'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  BUILD_TYPES, BuildTypeId, Step, Answers, classifyFreeText, branchQuestions,
  checkDisqualify, computeEffort, assumptionsFor, specId,
} from '@/lib/estimator';
import type { GhostHandle } from '@/components/Ghost/Ghost';
import type { ScopeReply } from '@/lib/scopeReply';
import styles from './ScopingChat.module.css';

type Phase = 'hero' | 'chat' | 'done';

interface Message {
  from: 'user' | 'bot';
  text: string;
}

interface ReadyResult {
  kind: 'ready';
  id: string;
  buildType: BuildTypeId;
  low: number;
  high: number;
  assumptions: string[];
}
interface DisqualifiedResult {
  kind: 'disqualified';
  reason: string;
}
interface OfferCallResult {
  kind: 'offerCall';
}
type Result = ReadyResult | DisqualifiedResult | OfferCallResult;

// Long enough for the dots to register as typing, short enough not to feel slow.
const MIN_TYPING_MS = 650;

const PLACEHOLDERS = [
  'a WhatsApp agent that closes tickets on its own',
  'syncing Shopify orders into Zoho without duplicates',
  'the internal tool three people fight a spreadsheet over',
  'rescuing a Bolt app before a client sees it',
  'a pipeline that stops silently dropping rows',
];

export interface ScopingChatHandle {
  selectType(id: BuildTypeId): void;
  focusInput(): void;
}

interface Props {
  ghostRef?: React.RefObject<GhostHandle | null>;
  initialType?: BuildTypeId | null;
  onFocusChange?: (focused: boolean) => void;
}

const ScopingChat = forwardRef<ScopingChatHandle, Props>(function ScopingChat(
  { ghostRef, initialType, onFocusChange },
  ref
) {
  const [phase, setPhase] = useState<Phase>('hero');
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState<Step | null>(null);
  const [buildType, setBuildType] = useState<BuildTypeId | null>(null);
  const [freeText, setFreeText] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [thinking, setThinking] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [contact, setContact] = useState({ email: '', name: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [awaitingAi, setAwaitingAi] = useState(false);

  const answersRef = useRef<Answers>({});
  const queueRef = useRef<Step[]>([]);
  const clarifyTurnsRef = useRef(0);
  const ambiguousPairRef = useRef<{ a: BuildTypeId; b: BuildTypeId } | null>(null);
  const sessionIdRef = useRef<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef<Message[]>([]);
  // Optimistic: the first call tells us whether a key is configured, and the
  // scripted branch takes over permanently if it is not.
  const aiEnabledRef = useRef(true);
  // askNext runs before resolveClassification is declared; a ref keeps the
  // reference honest instead of closing over a stale render's copy.
  const classifyRef = useRef<(text: string) => void>(() => {});
  const offerCallRef = useRef<() => void>(() => {});
  const buildTypeRef = useRef<BuildTypeId | null>(null);

  const setBuildTypeTracked = useCallback((id: BuildTypeId) => {
    buildTypeRef.current = id;
    setBuildType(id);
  }, []);

  useEffect(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    }
    const interval = setInterval(() => {
      setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  // The thread is a fixed-height scroll box, so without this a new question
  // lands below its own fold and the conversation looks stalled.
  useEffect(() => {
    const box = messagesRef.current;
    if (!box) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    box.scrollTo({ top: box.scrollHeight, behavior: reduced ? 'auto' : 'smooth' });
  }, [messages, thinking, step]);

  const labelOf = useCallback((id: BuildTypeId) => BUILD_TYPES.find(b => b.id === id)?.label ?? id, []);

  const pushMessage = useCallback((from: Message['from'], text: string) => {
    transcriptRef.current = [...transcriptRef.current, { from, text }];
    setMessages(transcriptRef.current);
  }, []);

  /**
   * Asks the model for the next question. Returns null whenever the AI cannot
   * answer — no key, timeout, bad shape — and the caller falls back to the
   * scripted branch, so the funnel never dead-ends on an API problem.
   */
  const fetchScopeStep = useCallback(async (): Promise<ScopeReply | null> => {
    try {
      const response = await fetch('/api/scope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: transcriptRef.current.map(m => ({
            role: m.from === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
          answers: answersRef.current,
          buildType: buildTypeRef.current ?? undefined,
        }),
      });
      if (!response.ok) return null;
      const reply = await response.json() as ScopeReply;
      return reply.status === 'unavailable' ? null : reply;
    } catch {
      return null;
    }
  }, []);

  const askNext = useCallback(async () => {
    if (aiEnabledRef.current) {
      setAwaitingAi(true);
      ghostRef?.current?.playThinking(true);
      const startedAt = Date.now();
      const reply = await fetchScopeStep();
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_TYPING_MS) await new Promise(r => setTimeout(r, MIN_TYPING_MS - elapsed));
      ghostRef?.current?.playThinking(false);
      setAwaitingAi(false);

      if (reply?.status === 'ask') {
        if (reply.buildType && !buildTypeRef.current) setBuildTypeTracked(reply.buildType);
        pushMessage('bot', reply.question);
        setStep({
          id: reply.field,
          prompt: reply.question,
          kind: reply.options?.length ? 'chips' : 'text',
          options: reply.options,
        });
        return;
      }
      if (reply?.status === 'done') {
        answersRef.current = { ...answersRef.current, ...reply.answers };
        setBuildTypeTracked(reply.buildType);
        finish();
        return;
      }

      // One failure is enough: stop paying the latency on every later turn.
      aiEnabledRef.current = false;

      // The model was going to work out the build type from their opening
      // message. Without it we have to classify before we can ask anything —
      // otherwise there is nothing to ask and we would finish on a null type.
      if (!buildTypeRef.current) {
        const lastUser = [...transcriptRef.current].reverse().find(m => m.from === 'user');
        if (lastUser) {
          classifyRef.current(lastUser.text);
          return;
        }
      }
      if (queueRef.current.length === 0 && buildTypeRef.current) {
        // Skip anything the model already got: dropping to the script should
        // continue the interview, not restart it.
        queueRef.current = branchQuestions(buildTypeRef.current)
          .filter(s => answersRef.current[s.id] === undefined);
      }
    }

    const next = queueRef.current.shift();
    if (!next) {
      finish();
      return;
    }
    pushMessage('bot', next.prompt);
    setStep(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pushMessage, fetchScopeStep, ghostRef, setBuildTypeTracked]);

  const startBranch = useCallback((type: BuildTypeId) => {
    // The scripted branch is the fallback; with AI on, the model picks the path.
    queueRef.current = aiEnabledRef.current ? [] : branchQuestions(type);
    askNext();
  }, [askNext]);

  const finish = useCallback(() => {
    setThinking(true);
    setStep(null);
    ghostRef?.current?.playThinking(true);
    setTimeout(() => {
      ghostRef?.current?.playThinking(false);
      setThinking(false);
      const type = buildTypeRef.current;
      if (!type) {
        // A spec with a blank type and an invented band is worse than admitting
        // we could not classify it.
        offerCallRef.current();
        return;
      }
      const dq = checkDisqualify(type, answersRef.current);
      if (dq.disqualified) {
        setResult({ kind: 'disqualified', reason: dq.reason! });
        setPhase('done');
        return;
      }
      const weeks = computeEffort(type, answersRef.current);
      const assumptions = assumptionsFor(type, answersRef.current);
      setResult({ kind: 'ready', id: specId(), buildType: type, low: weeks.low, high: weeks.high, assumptions });
      setPhase('done');
    }, 900);
  }, [ghostRef]);

  const selectType = useCallback((id: BuildTypeId) => {
    pushMessage('user', labelOf(id));
    setBuildTypeTracked(id);
    setPhase('chat');
    startBranch(id);
  }, [pushMessage, labelOf, startBranch, setBuildTypeTracked]);

  const offerCall = useCallback(() => {
    pushMessage('bot', "Let's just get on a call instead — happy to sort this out live.");
    setResult({ kind: 'offerCall' });
    setPhase('done');
  }, [pushMessage]);

  const resolveClassification = useCallback((text: string) => {
    const cls = classifyFreeText(text);
    if (cls.status === 'clear') {
      pushMessage('bot', `Got it — ${labelOf(cls.type)}.`);
      setBuildTypeTracked(cls.type);
      setPhase('chat');
      startBranch(cls.type);
    } else if (cls.status === 'ambiguous') {
      clarifyTurnsRef.current += 1;
      if (clarifyTurnsRef.current > 2) { offerCall(); return; }
      ambiguousPairRef.current = { a: cls.a, b: cls.b };
      pushMessage('bot', `That could be ${labelOf(cls.a)} or ${labelOf(cls.b)} — which matters first?`);
      setPhase('chat');
      setStep({ id: 'ambiguous-pick', prompt: '', kind: 'chips', options: [labelOf(cls.a), labelOf(cls.b)] });
    } else {
      clarifyTurnsRef.current += 1;
      if (clarifyTurnsRef.current > 2) { offerCall(); return; }
      pushMessage('bot', "Not quite enough to classify yet — what should be true after this ships that isn't true now?");
      setPhase('chat');
      setStep({ id: 'vague-followup', prompt: '', kind: 'text' });
    }
  }, [pushMessage, labelOf, startBranch, offerCall, setBuildTypeTracked]);

  classifyRef.current = resolveClassification;
  offerCallRef.current = offerCall;

  const handleAnswer = useCallback((value: string) => {
    if (!step) return;
    if (step.id === 'ambiguous-pick' && ambiguousPairRef.current) {
      const { a, b } = ambiguousPairRef.current;
      const picked = value === labelOf(a) ? a : b;
      pushMessage('user', value);
      pushMessage('bot', `Got it — ${labelOf(picked)}.`);
      setBuildTypeTracked(picked);
      setStep(null);
      startBranch(picked);
      return;
    }
    pushMessage('user', value);
    answersRef.current[step.id] = value;
    setStep(null);
    askNext();
  }, [step, pushMessage, labelOf, startBranch, askNext, setBuildTypeTracked]);

  const submitFreeText = useCallback(() => {
    const text = freeText.trim();
    if (!text) return;
    setFreeText('');

    // A free-text step the model asked for: record it and let the model react.
    if (step && step.kind === 'text' && step.id !== 'vague-followup') {
      pushMessage('user', text);
      answersRef.current[step.id] = text;
      setStep(null);
      askNext();
      return;
    }
    if (step?.id === 'vague-followup') {
      pushMessage('user', text);
      setStep(null);
      resolveClassification(text);
      return;
    }

    setPhase('chat');
    pushMessage('user', text);
    // With AI on, the model reads the opening message itself — keyword matching
    // is the fallback, not the primary path.
    if (aiEnabledRef.current) {
      askNext();
      return;
    }
    resolveClassification(text);
  }, [freeText, step, pushMessage, resolveClassification, askNext]);

  const resetAll = useCallback(() => {
    answersRef.current = {};
    queueRef.current = [];
    transcriptRef.current = [];
    aiEnabledRef.current = true;
    clarifyTurnsRef.current = 0;
    ambiguousPairRef.current = null;
    buildTypeRef.current = null;
    setPhase('hero');
    setMessages([]);
    setStep(null);
    setBuildType(null);
    setFreeText('');
    setThinking(false);
    setAwaitingAi(false);
    setResult(null);
    setContact({ email: '', name: '', phone: '' });
    setSubmitted(false);
    setSubmitting(false);
    setSubmitError(null);
  }, []);

  const submitLead = useCallback(async () => {
    if (!contact.email || submitting || !result) return;
    setSubmitting(true);
    setSubmitError(null);
    const conversation = messages.map(m => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }));
    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contact.name || undefined,
          email: contact.email,
          phone: contact.phone || undefined,
          conversation,
          buildType: buildType ?? undefined,
          answers: answersRef.current,
          effortLow: result.kind === 'ready' ? result.low : undefined,
          effortHigh: result.kind === 'ready' ? result.high : undefined,
          sessionId: sessionIdRef.current,
          specId: result.kind === 'ready' ? result.id : undefined,
        }),
      });
      const data = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null;

      // Confirming a save that never happened is the worst outcome here: the
      // prospect stops chasing us and we never learn they existed.
      if (!response.ok || !data?.ok) {
        setSubmitError(
          response.status === 429
            ? "That's a few briefs in a short window. Give it a few minutes, or email us directly."
            : "We couldn't save your brief. Try again, or email it to us directly."
        );
        return;
      }
      setSubmitted(true);
    } catch {
      setSubmitError('That didn’t send — check your connection and try again, or email us directly.');
    } finally {
      setSubmitting(false);
    }
  }, [contact, submitting, result, messages, buildType]);

  // If saving fails, the prospect still has a route to us that carries their
  // reference and effort band, so the conversation is not wasted.
  const mailtoFallback = (() => {
    const ref = result?.kind === 'ready' ? result.id : 'new brief';
    const band = result?.kind === 'ready' ? ` (${result.low}–${result.high} weeks)` : '';
    return `mailto:hello@plugabyte.com?subject=${encodeURIComponent(`Scoping brief ${ref}${band}`)}`;
  })();

  useImperativeHandle(ref, () => ({
    selectType(id: BuildTypeId) {
      resetAll();
      selectType(id);
    },
    focusInput() {
      inputRef.current?.focus();
    },
  }), [resetAll, selectType]);

  useEffect(() => {
    if (initialType) selectType(initialType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.chat}>
      {phase !== 'hero' && <h1 className={styles.srOnly}>Scoping your build</h1>}
      {phase === 'hero' && (
        <div className={styles.hero}>
          <h1 className={styles.question}>What are you trying to ship?</h1>
          <div className={styles.chips}>
            {BUILD_TYPES.map(bt => (
              <button key={bt.id} className={styles.chip} onClick={() => selectType(bt.id)}>
                {bt.label}
              </button>
            ))}
          </div>
          <div className={styles.inputRow}>
            <input
              ref={inputRef}
              className={styles.input}
              value={freeText}
              onChange={e => setFreeText(e.target.value)}
              onFocus={() => onFocusChange?.(true)}
              onBlur={() => onFocusChange?.(false)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submitFreeText(); } }}
              placeholder={PLACEHOLDERS[placeholderIdx]}
              aria-label="Describe what you are trying to build"
            />
            <button className={styles.send} onClick={submitFreeText} aria-label="Send">→</button>
          </div>
          <p className={styles.expectation}>A few questions, then you get effort in weeks.</p>
          <p className={styles.privacy}>This goes straight into your spec. If you send it to us, we keep the brief and your contact details so we can reply — nothing else, and never passed on.</p>
        </div>
      )}

      {phase !== 'hero' && (
        <div className={styles.thread}>
          <div className={styles.messages} ref={messagesRef}>
            {messages.map((m, i) => (
              <div key={i} className={m.from === 'user' ? styles.msgUser : styles.msgBot}>
                {m.text}
              </div>
            ))}
            {(thinking || awaitingAi) && (
              <div className={styles.typing} aria-label="Typing">
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
              </div>
            )}
          </div>

          {step && step.kind === 'chips' && (
            <div className={styles.chips}>
              {step.options?.map(o => (
                <button key={o} className={styles.stepChip} onClick={() => handleAnswer(o)}>{o}</button>
              ))}
            </div>
          )}

          {step && step.kind === 'text' && (
            <div className={styles.inputRow}>
              <input
                ref={inputRef}
                className={styles.input}
                value={freeText}
                onChange={e => setFreeText(e.target.value)}
                onFocus={() => onFocusChange?.(true)}
                onBlur={() => onFocusChange?.(false)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submitFreeText(); } }}
                placeholder="Say what should be true once it ships…"
                aria-label="Say what should be true once it ships"
              />
              <button className={styles.send} onClick={submitFreeText} aria-label="Send">→</button>
            </div>
          )}

          {phase === 'done' && result && (
            <div className={styles.done}>
              {result.kind === 'disqualified' && (
                <>
                  <span className={styles.badge}>We told them not to hire us</span>
                  <p className={styles.doneText}>{result.reason}</p>
                  <button className={styles.startOver} onClick={resetAll}>Start over</button>
                </>
              )}

              {result.kind !== 'disqualified' && !submitted && (
                <>
                  {result.kind === 'offerCall' && (
                    <p className={styles.doneText}>Still not quite landing on a build type over text — let&apos;s just talk it through.</p>
                  )}
                  {result.kind === 'ready' && (
                    <>
                      <p className={styles.specLine}>
                        {result.id} · {labelOf(result.buildType)} · {result.low}–{result.high} weeks
                      </p>
                      <ul className={styles.assumptions}>
                        {result.assumptions.map(a => <li key={a}>{a}</li>)}
                      </ul>
                    </>
                  )}
                  <div className={styles.contactForm}>
                    <p className={styles.contactTitle}>Where should this go?</p>
                    <input
                      className={styles.contactInput}
                      type="email"
                      required
                      placeholder="you@company.com"
                      aria-label="Your email address"
                      value={contact.email}
                      onChange={e => setContact(p => ({ ...p, email: e.target.value }))}
                    />
                    <input
                      className={styles.contactInput}
                      type="text"
                      placeholder="Name (optional)"
                      aria-label="Your name (optional)"
                      value={contact.name}
                      onChange={e => setContact(p => ({ ...p, name: e.target.value }))}
                    />
                    <input
                      className={styles.contactInput}
                      type="tel"
                      placeholder="Phone (optional)"
                      aria-label="Your phone number (optional)"
                      value={contact.phone}
                      onChange={e => setContact(p => ({ ...p, phone: e.target.value }))}
                    />
                    <button
                      className={styles.submitBtn}
                      onClick={submitLead}
                      disabled={!contact.email || submitting}
                    >
                      {submitting ? 'Sending…' : 'Send to Plugabyte →'}
                    </button>
                    {submitError && (
                      <p className={styles.submitError} role="alert">
                        {submitError}{' '}
                        <a className={styles.submitErrorLink} href={mailtoFallback}>hello@plugabyte.com</a>
                      </p>
                    )}
                  </div>
                  <button className={styles.startOver} onClick={resetAll}>Start over</button>
                </>
              )}

              {submitted && (
                <div className={styles.success}>
                  <p className={styles.successTitle}>You&apos;re on our radar.</p>
                  <p className={styles.doneText}>We&apos;ll review your brief and reach out within one business day.</p>
                  <button className={styles.startOver} onClick={resetAll}>Start over</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default ScopingChat;
