'use client';

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildBodyGeometry, SCALE, surfaceAt, toLocal, type SurfaceAnchor } from '@/lib/ghostGeometry';

export interface GhostHandle {
  setLookAt(x: number, y: number): void;
  playWave(): void;
  playThinking(on: boolean): void;
}

/**
 * A held pose, in radians. The brand system's sprite states are all expressed
 * as shoulder rotation plus sign rotation, so a pose is exactly those two
 * numbers plus how far the eyes are shut.
 */
export interface GhostPose {
  arm: number;
  bolt: number;
  /** 0 open, 1 fully closed. */
  lid?: number;
}

/** Named states from the brand system's sign-spinner set. */
export const POSES = {
  shoulder: { arm: 0.62, bolt: 0.95 },
  pointer: { arm: -0.42, bolt: 1.45 },
  slouch: { arm: -1.15, bolt: 0.55, lid: 0.72 },
} satisfies Record<string, GhostPose>;

interface Props {
  boltColor?: string;
  ghostColor?: string;
  onReady?: () => void;
  /** Holds a static pose and stops the idle loop — used to shoot stills. */
  pose?: GhostPose;
}

type RigState = 'idle' | 'wave' | 'thinking';

const FACE_COLOR = '#0e1d2c';
// Eye bumps follow the sculpt, but sized and set from the mark, which draws them
// large and low. Big low eyes on a round head is the whole friendliness cue.
const EYE_RADIUS = 9 * SCALE;
const EYE_SINK = EYE_RADIUS * 0.6; // bumps sit proud, not bulging
// A dark eye with no highlight reads dead, but an unlit white ball stuck on the
// front reads like a doll's eye. A glossy eye earns its highlight from the key
// light and the studio env instead, so it stays soft and moves with the head.
const BLINK_PERIOD = 4.6;
const BLINK_TIME = 0.14;
// The mark's bolt is ~64 units tall against a 97-unit body; the shape below is
// authored ~37 units tall, so it needs scaling up to match the sculpt.
const BOLT_SCALE = 1.7;
const BOLT_TILT = THREE.MathUtils.degToRad(-80); // -34 arm + -46 bolt, as in the mark
const ARM_RADIUS = 4 * SCALE;
const HAND_RADIUS = 6.5 * SCALE;
// RoomEnvironment is a bright studio box; at full strength it out-lights the key
// lights and ACES tone mapping bleaches the brand blue to white.
const SKIN = { roughness: 0.42, metalness: 0, clearcoat: 0.55, clearcoatRoughness: 0.25, envMapIntensity: 0.105 };

// Soft studio reflections — what actually sells a glossy moulded surface. Built
// locally from three's RoomEnvironment, so there is no HDRI fetch at runtime, and
// applied per material rather than to the scene so brightness stays per-object.
function useStudioEnvMap(): THREE.Texture {
  const gl = useThree(s => s.gl);
  const env = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const target = pmrem.fromScene(new RoomEnvironment(), 0.04);
    pmrem.dispose(); // the baked target outlives the generator
    return target;
  }, [gl]);
  useEffect(() => () => env.dispose(), [env]);
  return env.texture;
}

const GhostRig = forwardRef<GhostHandle, Props>(function GhostRig(
  { boltColor = '#F4586A', ghostColor = '#8FB8E8', onReady, pose },
  ref
) {
  const rootRef = useRef<THREE.Group>(null);
  const armRef = useRef<THREE.Group>(null);
  const boltRef = useRef<THREE.Group>(null);
  const eyeRefs = useRef<(THREE.Group | null)[]>([]);

  const target = useRef({ x: 0, y: 0 });
  const state = useRef<RigState>('idle');
  const stateUntil = useRef(0);
  const t = useRef(0);

  const bodyGeo = useMemo(() => buildBodyGeometry(), []);

  const envMap = useStudioEnvMap();

  // Features ride the body's surface normal, so they stay seated on a face that
  // curves away from the camera.
  const eyeL = surfaceAt(46.5, 52);
  const eyeR = surfaceAt(81.5, 52);
  const rightArm = surfaceAt(104, 78);
  const leftArm = surfaceAt(24, 78);
  const [leftHandX, leftHandY] = toLocal(10, 92);
  const [handX, handY] = (() => {
    // The SVG rotates the arm+bolt group -34deg about (104,78); replicate that
    // rotation here so the hand lands in the same spot relative to the body.
    const dx = 126 - 104, dy = 60 - 78;
    const a = THREE.MathUtils.degToRad(-34);
    const rx = dx * Math.cos(a) - dy * Math.sin(a);
    const ry = dx * Math.sin(a) + dy * Math.cos(a);
    return toLocal(104 + rx, 78 + ry);
  })();
  // The mark hangs the bolt off the upper right of the head (the arm group's
  // -34deg and the bolt's own -46deg compose to -80deg about (112, 51)), and the
  // sculpt keeps it there — big, flat and angled, not tucked down at the hand.
  const [boltX, boltY] = toLocal(112, 51);
  // The mark puts the bolt exactly where the hand is, so in 3D it has to sit
  // proud of the hand or the ball buries it.
  const boltZ = rightArm.position[2] + 0.3;

  const boltGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0.45, 1.15);
    shape.lineTo(-0.55, -0.05);
    shape.lineTo(-0.1, -0.05);
    shape.lineTo(-0.4, -1.15);
    shape.lineTo(0.6, 0.15);
    shape.lineTo(0.12, 0.15);
    shape.lineTo(0.45, 1.15);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.18, bevelSize: 0.12, bevelSegments: 1, curveSegments: 1 });
    geo.center();
    geo.computeBoundingSphere();
    return geo;
  }, []);

  // The bolt hangs well off the right and the far hand off the left, so the
  // mascot's centre is not the body's. Derive the shift from where those
  // actually land — eyeballing it once pushed the hand through the canvas edge.
  const rigOffsetX =
    -((leftHandX - HAND_RADIUS) + (boltX + (boltGeo.boundingSphere?.radius ?? 0) * BOLT_SCALE)) / 2;

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  useImperativeHandle(ref, () => ({
    setLookAt(x, y) {
      target.current = { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
    },
    playWave() {
      state.current = 'wave';
      stateUntil.current = t.current + 1.4;
    },
    playThinking(on) {
      state.current = on ? 'thinking' : 'idle';
      stateUntil.current = on ? Infinity : 0;
    },
  }), []);

  useFrame((_, delta) => {
    t.current += Math.min(delta, 0.05);
    const root = rootRef.current;
    if (!root) return;

    const breathe = Math.sin(t.current * 0.9) * 0.04;
    root.scale.set(1 + breathe, 1 - breathe * 0.7, 1 + breathe * 0.4);
    root.position.y = Math.sin(t.current * 0.9) * 0.18;
    root.rotation.y += (target.current.x * 0.4 - root.rotation.y) * 0.06;
    root.rotation.x += (-target.current.y * 0.22 - root.rotation.x) * 0.06;
    // A head permanently square to camera reads like a stare; a slight cocked
    // tilt that drifts is what makes it look attentive rather than watchful.
    root.rotation.z = 0.05 + Math.sin(t.current * 0.42) * 0.025;

    const phase = t.current % BLINK_PERIOD;
    const lid = phase < BLINK_TIME ? Math.sin((phase / BLINK_TIME) * Math.PI) : 0;
    for (const eye of eyeRefs.current) {
      if (eye) eye.scale.y = 1 - 0.88 * (pose ? (pose.lid ?? 0) : lid);
    }

    const armGroup = armRef.current;
    const boltGroup = boltRef.current;
    if (pose) {
      if (armGroup) armGroup.rotation.z = pose.arm;
      if (boltGroup) boltGroup.rotation.z = BOLT_TILT + pose.bolt;
      return;
    }
    if (state.current === 'wave' && t.current < stateUntil.current && armGroup) {
      armGroup.rotation.z = Math.sin(t.current * 10) * 0.35;
    } else if (state.current === 'thinking' && t.current < stateUntil.current && boltGroup) {
      boltGroup.rotation.y += 0.35;
      boltGroup.scale.setScalar(1 + Math.sin(t.current * 8) * 0.08);
    } else {
      state.current = 'idle';
      if (armGroup) armGroup.rotation.z *= 0.9;
      if (boltGroup) {
        boltGroup.rotation.y *= 0.9;
        boltGroup.scale.setScalar(1 + (boltGroup.scale.x - 1) * 0.85);
      }
    }
  });

  const skin = { color: ghostColor, envMap, ...SKIN };

  return (
    <group ref={rootRef} position={[rigOffsetX, 0, 0]}>
      <mesh geometry={bodyGeo}>
        <meshPhysicalMaterial {...skin} />
      </mesh>

      {/* The sculpt gives the eyes as raised bumps rather than flat discs, so
          they are spheres sunk into the face along its normal. Brand navy, since
          the ask was the sculpt's form in Plugabyte colours. */}
      <Eye anchor={eyeL} envMap={envMap} innerRef={el => { eyeRefs.current[0] = el; }} />
      <Eye anchor={eyeR} envMap={envMap} innerRef={el => { eyeRefs.current[1] = el; }} />

      <group ref={armRef} position={rightArm.position}>
        <Limb dx={handX - rightArm.position[0]} dy={handY - rightArm.position[1]} skin={skin} />
        <group
          ref={boltRef}
          position={[boltX - rightArm.position[0], boltY - rightArm.position[1], boltZ - rightArm.position[2]]}
          rotation={[0, -0.15, BOLT_TILT]}
          scale={BOLT_SCALE}
        >
          <mesh geometry={boltGeo}>
            <meshPhysicalMaterial color={boltColor} envMap={envMap} roughness={0.28} clearcoat={0.6} clearcoatRoughness={0.2} envMapIntensity={0.14} flatShading />
          </mesh>
        </group>
      </group>

      {/* The mark has a second arm; without it the 3D ghost reads one-sided. */}
      <group position={leftArm.position}>
        <Limb dx={leftHandX - leftArm.position[0]} dy={leftHandY - leftArm.position[1]} skin={skin} />
      </group>
    </group>
  );
});

function Eye({
  anchor,
  envMap,
  innerRef,
}: {
  anchor: SurfaceAnchor;
  envMap: THREE.Texture;
  innerRef: (el: THREE.Group | null) => void;
}) {
  const [x, y, z] = anchor.position;
  const [nx, , nz] = anchor.normal;
  return (
    <group ref={innerRef} position={[x - nx * EYE_SINK, y, z - nz * EYE_SINK]}>
      <mesh>
        <sphereGeometry args={[EYE_RADIUS, 32, 24]} />
        <meshPhysicalMaterial
          color={FACE_COLOR}
          envMap={envMap}
          envMapIntensity={0.45}
          roughness={0.14}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>
    </group>
  );
}

function Limb({ dx, dy, skin }: { dx: number; dy: number; skin: Record<string, unknown> }) {
  return (
    <>
      <mesh position={[dx / 2, dy / 2, 0]} rotation={[0, 0, Math.atan2(dy, dx) - Math.PI / 2]}>
        <capsuleGeometry args={[ARM_RADIUS, Math.hypot(dx, dy) * 0.95, 8, 16]} />
        <meshPhysicalMaterial {...skin} />
      </mesh>
      <mesh position={[dx, dy, 0]}>
        <sphereGeometry args={[HAND_RADIUS, 24, 16]} />
        <meshPhysicalMaterial {...skin} />
      </mesh>
    </>
  );
}

const GhostScene = forwardRef<GhostHandle, Props>(function GhostScene(props, ref) {
  return (
    <Canvas
      camera={{ position: [0, 0, 17.6], fov: 32 }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true, toneMappingExposure: 0.55, preserveDrawingBuffer: !!props.pose }}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <directionalLight position={[3, 5, 6]} intensity={1.5} />
      <directionalLight position={[-5, 1, -4]} intensity={0.5} color="#8fb8e8" />
      <directionalLight position={[4, -1, -4]} intensity={0.75} color={props.boltColor ?? '#F4586A'} />
      <GhostRig ref={ref} {...props} />
    </Canvas>
  );
});

export default GhostScene;
