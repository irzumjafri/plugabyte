'use client';

import { useEffect, useRef, useState } from 'react';
import Ghost, { type GhostHandle } from '@/components/Ghost/Ghost';
import ScopingChat, { type ScopingChatHandle } from '@/components/ScopingChat/ScopingChat';
import type { BuildTypeId } from '@/lib/estimator';
import styles from './LandingSection.module.css';

interface Props {
  chatRef: React.RefObject<ScopingChatHandle | null>;
  initialType?: BuildTypeId | null;
}

export default function LandingSection({ chatRef, initialType }: Props) {
  const ghostRef = useRef<GhostHandle>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const [chatFocused, setChatFocused] = useState(false);

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
    <section
      className={`${styles.landing} ${chatFocused ? styles.chatFocused : ''}`}
      onPointerMove={handlePointer}
      onPointerDown={handlePointer}
      onPointerEnter={handlePointerEnter}
    >
      <div className={styles.inner}>
        <Ghost ref={ghostRef} size={260} className={styles.ghost} />
        <ScopingChat ref={chatRef} ghostRef={ghostRef} initialType={initialType} onFocusChange={setChatFocused} />
      </div>
    </section>
  );
}
