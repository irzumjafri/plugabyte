'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  BUILD_TYPES, BuildTypeId, Step, Answers, classifyFreeText, branchQuestions,
  checkDisqualify, computeEffort, assumptionsFor, specId,
} from '@/lib/estimator';
import type { GhostHandle } from '@/components/Ghost/Ghost';
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

  const answersRef = useRef<Answers>({});
  const queueRef = useRef<Step[]>([]);
  const clarifyTurnsRef = useRef(0);
  const ambiguousPairRef = useRef<{ a: BuildTypeId; b: BuildTypeId } | null>(null);
  const sessionIdRef = useRef<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
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

  const labelOf = useCallback((id: BuildTypeId) => BUILD_TYPES.find(b => b.id === id)?.label ?? id, []);

  const pushMessage = useCallback((from: Message['from'], text: string) => {
    setMessages(prev => [...prev, { from, text }]);
  }, []);

  const askNext = useCallback(() => {
    const next = queueRef.current.shift();
    if (!next) {
      finish();
      return;
    }
    pushMessage('bot', next.prompt);
    setStep(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pushMessage]);

  const startBranch = useCallback((type: BuildTypeId) => {
    queueRef.current = branchQuestions(type);
    askNext();
  }, [askNext]);

  const finish = useCallback(() => {
    setThinking(true);
    setStep(null);
    ghostRef?.current?.playThinking(true);
    setTimeout(() => {
      ghostRef?.current?.playThinking(false);
      setThinking(false);
      const type = buildTypeRef.current!;
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
    if (step?.id === 'vague-followup') {
      pushMessage('user', text);
      setStep(null);
      resolveClassification(text);
      return;
    }
    setPhase('chat');
    pushMessage('user', text);
    resolveClassification(text);
  }, [freeText, step, pushMessage, resolveClassification]);

  const resetAll = useCallback(() => {
    answersRef.current = {};
    queueRef.current = [];
    clarifyTurnsRef.current = 0;
    ambiguousPairRef.current = null;
    buildTypeRef.current = null;
    setPhase('hero');
    setMessages([]);
    setStep(null);
    setBuildType(null);
    setFreeText('');
    setThinking(false);
    setResult(null);
    setContact({ email: '', name: '', phone: '' });
    setSubmitted(false);
  }, []);

  const submitLead = useCallback(async () => {
    if (!contact.email || submitting || !result) return;
    setSubmitting(true);
    const conversation = messages.map(m => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }));
    try {
      await fetch('/api/lead', {
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
        }),
      });
    } finally {
      setSubmitting(false);
      setSubmitted(true);
    }
  }, [contact, submitting, result, messages, buildType]);

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
            />
            <button className={styles.send} onClick={submitFreeText} aria-label="Send">→</button>
          </div>
          <p className={styles.expectation}>About four questions, then you get effort in weeks.</p>
          <p className={styles.privacy}>This goes straight into your spec — nothing else, and nothing kept past this session other than what you send us.</p>
        </div>
      )}

      {phase !== 'hero' && (
        <div className={styles.thread}>
          <div className={styles.messages}>
            {messages.map((m, i) => (
              <div key={i} className={m.from === 'user' ? styles.msgUser : styles.msgBot}>
                {m.text}
              </div>
            ))}
            {thinking && <div className={styles.computing}>computing…</div>}
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
                      value={contact.email}
                      onChange={e => setContact(p => ({ ...p, email: e.target.value }))}
                    />
                    <input
                      className={styles.contactInput}
                      type="text"
                      placeholder="Name (optional)"
                      value={contact.name}
                      onChange={e => setContact(p => ({ ...p, name: e.target.value }))}
                    />
                    <input
                      className={styles.contactInput}
                      type="tel"
                      placeholder="Phone (optional)"
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
