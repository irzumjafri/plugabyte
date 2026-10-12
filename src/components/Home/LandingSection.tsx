'use client';

import { useEffect, useRef } from 'react';
import Ghost, { type GhostHandle } from '@/components/Ghost/Ghost';
import ScopingChat, { type ScopingChatHandle } from '@/components/ScopingChat/ScopingChat';
import SceneHero from '@/components/Scene/SceneHero';
import ChatOverlay from '@/components/ScopingChat/ChatOverlay';
import Annotation from '@/components/Scene/Annotation';
import EmailLink from '@/components/EmailLink';
import Link from 'next/link';
import type { BuildTypeId } from '@/lib/estimator';
import styles from './LandingSection.module.css';

interface Props {
  chatRef: React.RefObject<ScopingChatHandle | null>;
  initialType?: BuildTypeId | null;
  chatOpen: boolean;
  onOpenChat: () => void;
  onCloseChat: () => void;
}

const CAPABILITIES = ['Product engineering', 'Integrations', 'Rescue & scale'];

export default function LandingSection({ chatRef, initialType, chatOpen, onOpenChat, onCloseChat }: Props) {
  const ghostRef = useRef<GhostHandle>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rectRef = useRef<DOMRect | null>(null);

  // The timer re-armed itself inside its own callback with no cleanup, so the
  // wave loop kept firing after this section unmounted.
  useEffect(() => () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
  }, []);

  function resetIdleTimer() {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      ghostRef.current?.playWave();
      resetIdleTimer();
    }, 15000);
  }

  // Pointer events cover mouse, pen and touch — the ghost was mouse-only, so on
  // a phone it never reacted at all, against the "always reactive" constraint.
  function handlePointer(e: React.PointerEvent<HTMLElement>) {
    // getBoundingClientRect on every move was a layout read per event.
    const r = rectRef.current ?? e.currentTarget.getBoundingClientRect();
    rectRef.current = r;
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    ghostRef.current?.setLookAt(nx, -ny);
    resetIdleTimer();
  }

  function handlePointerEnter(e: React.PointerEvent<HTMLElement>) {
    rectRef.current = e.currentTarget.getBoundingClientRect();
    resetIdleTimer();
  }

  return (
    <div
      onPointerMove={handlePointer}
      onPointerDown={handlePointer}
      onPointerEnter={handlePointerEnter}
    >
      <SceneHero
        src="/scenes/workshop-night.jpg"
        alt=""
        side="left"
        ghost={<Ghost ref={ghostRef} className={styles.heroGhost} />}
        note={<Annotation arrow="down-left" onArt>Big ideas.<br />Working parts.</Annotation>}
      >
        <div className={styles.heroCopy}>
          <h1 className={styles.title}>
            Plug in.<br />Light up.<br /><span className={styles.titleAccent}>Ship it.</span>
          </h1>
          <p className={styles.lead}>Good ideas deserve a life outside the demo.</p>
          <button
            type="button"
            className={styles.cta}
            onClick={onOpenChat}
          >
            What are you building? <span aria-hidden="true">↗</span>
          </button>
          <div className={styles.altActions}>
            <Link href="/rescue" className={styles.secondaryCta}>
              Something already broken? <span aria-hidden="true">→</span>
            </Link>
            <EmailLink className={styles.emailLink} />
          </div>
          <ul className={styles.capabilities}>
            {CAPABILITIES.map(c => <li key={c}>{c}</li>)}
          </ul>
        </div>
      </SceneHero>

      <ChatOverlay open={chatOpen} onClose={onCloseChat} ghostRef={ghostRef}>
        <ScopingChat ref={chatRef} ghostRef={ghostRef} initialType={initialType} />
      </ChatOverlay>
    </div>
  );
}
