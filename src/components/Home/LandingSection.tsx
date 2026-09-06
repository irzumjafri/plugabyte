'use client';

import { useRef } from 'react';
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
  const focusWrapRef = useRef<HTMLDivElement>(null);

  function resetIdleTimer() {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      ghostRef.current?.playWave();
      resetIdleTimer();
    }, 15000);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    ghostRef.current?.setLookAt(nx, -ny);
    resetIdleTimer();
  }

  function handleFocusChange(focused: boolean) {
    focusWrapRef.current?.classList.toggle(styles.chatFocused, focused);
  }

  return (
    <section className={styles.landing} onMouseMove={handleMouseMove} onMouseEnter={resetIdleTimer}>
      <div ref={focusWrapRef} className={styles.inner}>
        <Ghost ref={ghostRef} size={260} className={styles.ghost} />
        <ScopingChat ref={chatRef} ghostRef={ghostRef} initialType={initialType} onFocusChange={handleFocusChange} />
      </div>
    </section>
  );
}
