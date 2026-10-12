'use client';

import { useEffect, useRef, useState } from 'react';
import Ghost, { type GhostHandle } from '@/components/Ghost/Ghost';

/**
 * The live ghost on a page that has no scene plate, tracking the pointer across
 * the whole window rather than only its own box — on a mostly-typographic page
 * a small ghost that only reacts when you happen to cross it reads as broken.
 *
 * It mounts only once it is near the viewport. Every use of this component sits
 * in a closing band below the fold, and the WebGL bundle it pulls in is 231 KB
 * — the single largest asset on the site. Downloading that before anyone has
 * scrolled to it spends a visitor's bandwidth on decoration they may never see.
 */
export default function GhostStage({ className }: { className?: string }) {
  const ghost = useRef<GhostHandle>(null);
  const box = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect --
     The rule targets state set synchronously while an effect runs, which causes
     a second render pass. Here the state is set from an IntersectionObserver
     callback firing later, in response to the user scrolling — that is the
     intended way to do this, and there is no render-loop risk because the
     observer disconnects on first intersection. The one synchronous call is the
     no-IntersectionObserver fallback, which runs once and never repeats. */
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    // No IntersectionObserver (old browsers, jsdom): show it rather than
    // leaving a permanent hole where the mascot should be.
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      // A screen's warning, so it has loaded by the time it scrolls into view.
      { rootMargin: '800px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

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
    <div ref={box} className={className}>
      {near && <Ghost ref={ghost} />}
    </div>
  );
}
