'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import GhostSprite from './GhostSprite';
import type { GhostHandle } from './GhostScene';
import styles from './Ghost.module.css';

const GhostScene = dynamic(() => import('./GhostScene'), { ssr: false });

export type { GhostHandle };

interface Props {
  size?: number;
  className?: string;
}

// A flat SVG of the mark used to paint first and crossfade out as WebGL mounted,
// but a flat mark morphing into a lit 3D one is a jarring swap — the two never
// line up. A neutral spinner holds the space instead, so only the 3D ghost ever
// reads as the mascot. The flat mark is still the fallback when WebGL never
// arrives at all, since a spinner that never resolves is worse than a swap.
const Ghost = forwardRef<GhostHandle, Props>(function Ghost({ size = 230, className }, ref) {
  const [sceneReady, setSceneReady] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const sceneRef = useRef<GhostHandle>(null);

  useEffect(() => {
    if (sceneReady) return;
    const timer = setTimeout(() => setGaveUp(true), 6000);
    return () => clearTimeout(timer);
  }, [sceneReady]);

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
    <div className={`${styles.wrap} ${className ?? ''}`} style={{ width: size, height: size }}>
      {!sceneReady && !gaveUp && (
        <span className={styles.loader} role="status" aria-label="Loading" />
      )}
      {!sceneReady && gaveUp && <GhostSprite opacity={1} waving={false} thinking={false} />}
      <div className={sceneReady ? styles.sceneReady : styles.scene}>
        <GhostScene ref={sceneRef} onReady={() => setSceneReady(true)} />
      </div>
    </div>
  );
});

export default Ghost;
