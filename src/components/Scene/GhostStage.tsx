'use client';

import { useEffect, useRef } from 'react';
import Ghost, { type GhostHandle } from '@/components/Ghost/Ghost';

/**
 * The live ghost on a page that has no scene plate, tracking the pointer across
 * the whole window rather than only its own box — on a mostly-typographic page
 * a small ghost that only reacts when you happen to cross it reads as broken.
 */
export default function GhostStage({ className }: { className?: string }) {
  const ghost = useRef<GhostHandle>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      ghost.current?.setLookAt(
        (e.clientX / window.innerWidth) * 2 - 1,
        -((e.clientY / window.innerHeight) * 2 - 1),
      );
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return (
    <div className={className}>
      <Ghost ref={ghost} />
    </div>
  );
}
