'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import GhostSprite from './GhostSprite';
import type { GhostHandle } from './GhostScene';
import styles from './Ghost.module.css';

const GhostScene = dynamic(() => import('./GhostScene'), { ssr: false });

export type { GhostHandle };

interface Props {
  /**
   * Fixed square size in px. Omit to let the parent size it — the scene heroes
   * need a fluid ghost, and an inline width beats any class they could set.
   */
  size?: number;
  className?: string;
}

// A flat SVG of the mark used to paint first and crossfade out as WebGL mounted,
// but a flat mark morphing into a lit 3D one is a jarring swap — the two never
// line up. A neutral spinner holds the space instead, so only the 3D ghost ever
// reads as the mascot. The flat mark is still the fallback when WebGL never
// arrives at all, since a spinner that never resolves is worse than a swap.
const Ghost = forwardRef<GhostHandle, Props>(function Ghost({ size, className }, ref) {
  const [sceneReady, setSceneReady] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [mayMount, setMayMount] = useState(false);
  const sceneRef = useRef<GhostHandle>(null);

  // Booting WebGL during hydration held the hero image off the screen: the
  // plate finished downloading in 9ms but did not paint until 2.3s, because
  // the main thread was busy initialising Three.js. Waiting until the page has
  // loaded and the thread is idle lets the image paint first. The loader below
  // already holds the space, so nothing moves when the scene arrives.
  useEffect(() => {
    let idle: number | undefined;
    const start = () => {
      const ric = window.requestIdleCallback;
      if (ric) idle = ric(() => setMayMount(true), { timeout: 1200 });
      else idle = window.setTimeout(() => setMayMount(true), 200);
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    return () => {
      window.removeEventListener('load', start);
      if (idle !== undefined) {
        if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
        else clearTimeout(idle);
      }
    };
  }, []);

  useEffect(() => {
    if (sceneReady || !mayMount) return;
    const timer = setTimeout(() => setGaveUp(true), 6000);
    return () => clearTimeout(timer);
  }, [sceneReady, mayMount]);

  useImperativeHandle(ref, () => ({
    setLookAt(x: number, y: number) {
      sceneRef.current?.setLookAt(x, y);
    },
    playWave() {
      sceneRef.current?.playWave();
    },
    playThinking(on: boolean) {
      sceneRef.current?.playThinking(on);
    },
  }), []);

  return (
    <div
      className={`${styles.wrap} ${className ?? ''}`}
      style={size ? { width: size, height: size } : undefined}
    >
      {!sceneReady && !gaveUp && (
        <span className={styles.loader} role="status" aria-label="Loading" />
      )}
      {!sceneReady && gaveUp && <GhostSprite opacity={1} waving={false} thinking={false} />}
      <div className={sceneReady ? styles.sceneReady : styles.scene}>
        {mayMount && <GhostScene ref={sceneRef} onReady={() => setSceneReady(true)} />}
      </div>
    </div>
  );
});

export default Ghost;
