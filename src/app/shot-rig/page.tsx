'use client';

import { useEffect, useRef } from 'react';
import GhostScene, { POSES, type GhostHandle, type GhostPose } from '@/components/Ghost/GhostScene';

/**
 * Render rig for the ghost stills in public/ghost/.
 *
 * The site's illustrations are frames of the actual mascot rather than drawings
 * of it, so they cannot drift from the model: change the sculpt and re-shoot.
 * Not linked from anywhere — it exists to be screenshotted.
 *
 * ?pose=shoulder|pointer|slouch  — a named state from the brand system
 * &arm=&bolt=&lid=               — override any of them while dialling one in
 * &look=x,y
 */
function readPose(search: string): GhostPose & { look: [number, number] } {
  const q = new URLSearchParams(search);
  const base: GhostPose = POSES[q.get('pose') as keyof typeof POSES] ?? POSES.shoulder;
  const num = (k: string, d: number) => (q.has(k) ? Number(q.get(k)) : d);
  const [lx, ly] = (q.get('look') ?? '0,0').split(',').map(Number);
  return {
    arm: num('arm', base.arm),
    bolt: num('bolt', base.bolt),
    lid: num('lid', ('lid' in base ? base.lid : 0) ?? 0),
    look: [lx, ly],
  };
}

export default function ShotPage() {
  const ghost = useRef<GhostHandle>(null);
  // Read during render, not in an effect: the query string never changes for
  // the life of the page, so there is no state to hold.
  const pose = readPose(typeof window === 'undefined' ? '' : window.location.search);

  useEffect(() => {
    ghost.current?.setLookAt(pose.look[0], pose.look[1]);
  }, [pose.look]);

  return (
    <div id="shot" style={{ width: 760, height: 760, background: 'transparent' }}>
      <GhostScene ref={ghost} pose={pose} />
    </div>
  );
}
