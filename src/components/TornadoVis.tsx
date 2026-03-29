'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { latLngToLocal } from '@/lib/geo';

// Props: single interpolated position (computed by SceneContent animation loop)
export interface TornadoVisProps {
  lat: number;
  lng: number;
  width_m: number;
  wind_speed_mph: number;
  centerLat: number;
  centerLng: number;
}

// ─── CanvasTexture factory: horizontal bands for scrolling UV effect ──────────
function makeBandTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width  = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  // White base so material color shows through unmodified
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 256, 512);
  // Overlay dark bands
  const BANDS = 16;
  for (let i = 0; i < BANDS; i++) {
    if (i % 2 === 0) continue;
    const y = (i / BANDS) * 512;
    const h = 512 / BANDS;
    ctx.fillStyle = 'rgba(0,0,0,0.48)';
    ctx.fillRect(0, y, 256, h);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 6);
  return tex;
}

// ─── Radial-gradient shadow texture ──────────────────────────────────────────
function makeShadowTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width  = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0,    'rgba(0,0,0,0.65)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0.32)');
  grad.addColorStop(1,    'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

// ─── Ground shadow: pulsing radial-gradient circle ───────────────────────────
function GroundShadow({ radius }: { radius: number }) {
  const ref     = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => makeShadowTexture(), []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const pulse = 0.9 + Math.sin(t * 3.1) * 0.1;
    ref.current.scale.set(pulse, 1, pulse);
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.28 + Math.abs(Math.sin(t * 2.3)) * 0.18;
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
      <circleGeometry args={[radius * 1.4, 64]} />
      <meshBasicMaterial
        map={texture ?? undefined}
        color={texture ? undefined : '#000000'}
        transparent
        opacity={0.38}
        depthWrite={false}
      />
    </mesh>
  );
}

// ─── Dust ring: steady pulsing ring + periodically expanding spawn rings ──────
function DustRing({ radius }: { radius: number }) {
  const steadyRef = useRef<THREE.Mesh>(null);

  // Expanding ring state (up to 3 active at once)
  const ringMeshes = useRef<(THREE.Mesh | null)[]>([null, null, null]);
  const ringBirths = useRef<number[]>([]);
  const lastSpawn  = useRef(-999);
  const expandGeom = useMemo(() => new THREE.RingGeometry(0.7, 1.0, 48), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Steady ring
    if (steadyRef.current) {
      const pulse = 0.92 + Math.sin(t * 2.7) * 0.08;
      steadyRef.current.scale.set(pulse, 1, pulse);
      (steadyRef.current.material as THREE.MeshStandardMaterial).opacity =
        0.12 + Math.abs(Math.sin(t * 1.9)) * 0.22;
    }

    // Spawn a new expanding ring every ~1.5 s
    if (t - lastSpawn.current >= 1.5 && ringBirths.current.length < 3) {
      ringBirths.current.push(t);
      lastSpawn.current = t;
    }
    // Cull expired
    ringBirths.current = ringBirths.current.filter((b) => t - b < 1.5);

    // Update each expanding ring mesh slot
    for (let i = 0; i < 3; i++) {
      const mesh  = ringMeshes.current[i];
      if (!mesh) continue;
      const birth = ringBirths.current[i];
      if (birth === undefined) { mesh.visible = false; continue; }

      const progress = (t - birth) / 1.5;              // 0 → 1
      const r = radius * (0.5 + progress * 2.0);        // r*0.5 → r*2.5
      mesh.scale.set(r, 1, r);
      mesh.visible = true;
      (mesh.material as THREE.MeshStandardMaterial).opacity = (1 - progress) * 0.32;
    }
  });

  return (
    <>
      {/* Steady pulsing ring */}
      <mesh ref={steadyRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.3, 0]}>
        <ringGeometry args={[radius * 0.7, radius * 1.7, 64]} />
        <meshStandardMaterial
          color="#3d1c06"
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Three expanding spawn rings (pre-allocated, activated by birth array) */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(el) => { ringMeshes.current[i] = el; }}
          geometry={expandGeom}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.6, 0]}
          visible={false}
        >
          <meshStandardMaterial
            color="#5a2a08"
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
}

// ─── Debris ring: instanced boxes orbiting the funnel base (UNCHANGED) ───────
const DEBRIS_COUNT = 80;

function DebrisRing({ radius }: { radius: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy   = useMemo(() => new THREE.Object3D(), []);

  const data = useMemo(() => {
    const angles = new Float32Array(DEBRIS_COUNT);
    const radii  = new Float32Array(DEBRIS_COUNT);
    const speeds = new Float32Array(DEBRIS_COUNT);
    const scales = new Float32Array(DEBRIS_COUNT);
    const yBase  = new Float32Array(DEBRIS_COUNT);

    for (let i = 0; i < DEBRIS_COUNT; i++) {
      angles[i] = (i / DEBRIS_COUNT) * Math.PI * 2;
      radii[i]  = radius * (0.45 + Math.random() * 0.85);
      speeds[i] = 1.1 + Math.random() * 0.8;
      scales[i] = 0.5 + Math.random() * 2.0;
      yBase[i]  = Math.random() * 28;
    }
    return { angles, radii, speeds, scales, yBase };
  }, [radius]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = clock.getElapsedTime();

    for (let i = 0; i < DEBRIS_COUNT; i++) {
      const angle = data.angles[i] - t * 1.5 * data.speeds[i];
      dummy.position.set(
        Math.cos(angle) * data.radii[i],
        data.yBase[i],
        Math.sin(angle) * data.radii[i],
      );
      const s = data.scales[i];
      dummy.scale.set(s, s, s);
      dummy.rotation.set(t * data.speeds[i] * 1.3, t * data.speeds[i], 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, DEBRIS_COUNT]}>
      <boxGeometry args={[3, 3, 3]} />
      <meshStandardMaterial color="#1a0c04" roughness={0.95} />
    </instancedMesh>
  );
}

// ─── Single funnel layer with scrolling band texture ─────────────────────────
interface FunnelLayerProps {
  topRadius: number;
  bottomRadius: number;
  height: number;
  yOffset?: number;
  color: string;
  opacity: number;
  emissive?: string;
  emissiveIntensity?: number;
  /** rad/s — negative = counterclockwise from above */
  rotSpeed: number;
}

function FunnelLayer({
  topRadius,
  bottomRadius,
  height,
  yOffset = 0,
  color,
  opacity,
  emissive,
  emissiveIntensity = 0,
  rotSpeed,
}: FunnelLayerProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geom = useMemo(
    () => new THREE.CylinderGeometry(topRadius, bottomRadius, height, 32, 8, true),
    [topRadius, bottomRadius, height],
  );

  // Each layer gets its own scrolling band texture
  const texture = useMemo(() => makeBandTexture(), []);

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * rotSpeed;
    // Scroll texture downward — implies updraft/suction into ground
    if (texture) texture.offset.y -= delta * 0.4;
  });

  return (
    <mesh ref={meshRef} geometry={geom} position={[0, height / 2 + yOffset, 0]}>
      <meshStandardMaterial
        map={texture ?? undefined}
        color={color}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
        emissive={emissive ?? color}
        emissiveIntensity={emissiveIntensity}
      />
    </mesh>
  );
}

// ─── Cloud base: dark disk + downward connecting cone at funnel top ───────────
function CloudBase({ radius, H }: { radius: number; H: number }) {
  const diskRef = useRef<THREE.Mesh>(null);
  const coneRef = useRef<THREE.Mesh>(null);

  const diskGeom = useMemo(
    () => new THREE.CylinderGeometry(radius * 2.5, radius * 2.5, 80, 64, 1, false),
    [radius],
  );
  // Connecting cone: wide at sky (topRadius), narrow where it meets funnel top (bottomRadius)
  const coneGeom = useMemo(
    () => new THREE.CylinderGeometry(radius * 3, radius, 200, 32, 1, true),
    [radius],
  );

  useFrame((_, delta) => {
    // Rotate opposite direction to outer funnel (+0.3 instead of -0.3)
    if (diskRef.current) diskRef.current.rotation.y += delta * 0.28;
    if (coneRef.current) coneRef.current.rotation.y += delta * 0.18;
  });

  return (
    <>
      {/* Flat storm cloud base disk sitting at funnel top */}
      <mesh ref={diskRef} geometry={diskGeom} position={[0, H, 0]}>
        <meshStandardMaterial
          color="#0a0a0a"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/*
       * Connecting cone: center at y = H + 100 so it spans H → H+200.
       * topRadius (wide) is at +Y = H+200 (sky), bottomRadius (narrow) at -Y = H (funnel top).
       */}
      <mesh ref={coneRef} geometry={coneGeom} position={[0, H + 100, 0]}>
        <meshStandardMaterial
          color="#050810"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

// ─── Lightning: jagged bolts that flash and fade inside the funnel ────────────
const N_BOLTS = 4;
const BOLT_SEGS = 10;

function Lightning({ radius, H }: { radius: number; H: number }) {
  // Each bolt: a THREE.Line whose positions are regenerated on a random timer
  const bolts = useMemo(() => {
    return Array.from({ length: N_BOLTS }, () => {
      const positions = new Float32Array((BOLT_SEGS + 1) * 3);
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.LineBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0,
      });
      return new THREE.Line(geom, mat);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Per-bolt mutable state kept in refs (no React re-renders needed)
  const boltState = useMemo(
    () =>
      bolts.map(() => ({
        nextFlash: Math.random() * 0.25,
        fadeAge:   99,
      })),
    [bolts],
  );

  useFrame((_, delta) => {
    for (let b = 0; b < N_BOLTS; b++) {
      const state = boltState[b];
      const bolt  = bolts[b];
      const mat   = bolt.material as THREE.LineBasicMaterial;

      state.nextFlash -= delta;
      state.fadeAge   += delta;

      if (state.nextFlash <= 0) {
        // Regenerate jagged bolt path
        const attr = bolt.geometry.attributes.position as THREE.BufferAttribute;
        const arr  = attr.array as Float32Array;

        const sx = (Math.random() - 0.5) * radius * 0.35;
        const sy = H * (0.5 + Math.random() * 0.45);
        const sz = (Math.random() - 0.5) * radius * 0.35;
        const ex = (Math.random() - 0.5) * radius * 0.14;
        const ey = H * (0.05 + Math.random() * 0.32);
        const ez = (Math.random() - 0.5) * radius * 0.14;

        for (let s = 0; s <= BOLT_SEGS; s++) {
          const f      = s / BOLT_SEGS;
          const jitter = Math.sin(f * Math.PI) * 0.32; // max jitter at midpoint
          arr[s * 3 + 0] = sx + (ex - sx) * f + (Math.random() - 0.5) * radius * jitter;
          arr[s * 3 + 1] = sy + (ey - sy) * f;
          arr[s * 3 + 2] = sz + (ez - sz) * f + (Math.random() - 0.5) * radius * jitter;
        }
        attr.needsUpdate = true;
        bolt.geometry.computeBoundingSphere();

        mat.opacity     = 0.75 + Math.random() * 0.25;
        state.fadeAge   = 0;
        state.nextFlash = Math.random() * 0.2 + 0.08;
      }

      // Fade to 0 over ~0.1 s after the initial flash
      if (state.fadeAge > 0.02) {
        mat.opacity = Math.max(0, mat.opacity - delta * 9);
      }
    }
  });

  return (
    <>
      {bolts.map((bolt, i) => (
        <primitive key={i} object={bolt} />
      ))}
    </>
  );
}

// ─── Full tornado funnel assembly ─────────────────────────────────────────────
function TornadoFunnel({
  position,
  width_m,
}: {
  position: [number, number, number];
  width_m: number;
}) {
  const groupRef    = useRef<THREE.Group>(null);
  const flickerRef  = useRef<THREE.PointLight>(null);
  const groundLight = useRef<THREE.PointLight>(null);

  // DISPLAY_SCALE: width_m is real meters (200-800m for EF tornado).
  // Buildings are also in real meters (10-30 units wide) so we scale
  // the display radius down to look right relative to the scene.
  const DISPLAY_SCALE = 0.12;
  const radius = Math.max(Math.min(width_m * 0.5 * DISPLAY_SCALE, 55), 20);
  const H = radius * 8;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Compound wobble — two overlapping sine/cosine frequencies for organic sway
    if (groupRef.current) {
      groupRef.current.position.set(
        position[0] + Math.sin(t * 0.42) * 18 + Math.sin(t * 1.1) * 6,
        position[1],
        position[2] + Math.cos(t * 0.31) * 12 + Math.cos(t * 0.87) * 4,
      );
    }

    // Core flicker: 0.4 → 1.2 intensity
    if (flickerRef.current) {
      flickerRef.current.intensity = 0.4 + Math.random() * 0.8;
    }

    // Ground glow flicker
    if (groundLight.current) {
      groundLight.current.intensity = 0.2 + Math.random() * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Ground contact */}
      <GroundShadow radius={radius} />
      <DustRing     radius={radius} />

      {/* Orbiting debris */}
      <DebrisRing radius={radius} />

      {/*
       * Funnel layers — CylinderGeometry(topRadius, bottomRadius, height)
       * topRadius = wide (sky, +Y), bottomRadius = narrow (ground, -Y).
       * Mesh positioned at y = height/2 so bottom face sits at y = 0 (ground).
       * Each layer slightly smaller and faster than the one outside it.
       */}

      {/* Layer 1 — outer shell */}
      <FunnelLayer
        topRadius={radius}
        bottomRadius={radius * 0.055}
        height={H}
        color="#200d08"
        opacity={0.82}
        rotSpeed={-0.3}
      />

      {/* Layer 2 — mid shell */}
      <FunnelLayer
        topRadius={radius * 0.73}
        bottomRadius={radius * 0.038}
        height={H * 0.95}
        color="#2e1208"
        opacity={0.60}
        rotSpeed={-0.52}
      />

      {/* Layer 3 — inner shell, blue-grey tint */}
      <FunnelLayer
        topRadius={radius * 0.46}
        bottomRadius={radius * 0.022}
        height={H * 0.88}
        color="#0f1628"
        opacity={0.48}
        rotSpeed={-0.78}
      />

      {/* Layer 4 — core glow, cyan emissive */}
      <FunnelLayer
        topRadius={radius * 0.22}
        bottomRadius={radius * 0.01}
        height={H * 0.78}
        color="#a8d8f0"
        opacity={0.28}
        emissive="#22d3ee"
        emissiveIntensity={2.5}
        rotSpeed={-0.9}
      />

      {/* Lightning inside funnel */}
      <Lightning radius={radius} H={H} />

      {/* Cloud connection at funnel top */}
      <CloudBase radius={radius} H={H} />

      {/* Core flickering light (cool blue-white) */}
      <pointLight
        ref={flickerRef}
        position={[0, H * 0.35, 0]}
        color="#b0dfff"
        intensity={0.7}
        distance={radius * 4}
        decay={2}
      />

      {/* Ground contact warm glow — debris friction */}
      <pointLight
        ref={groundLight}
        position={[0, 30, 0]}
        color="#ff4400"
        intensity={0.3}
        distance={radius * 2}
        decay={2}
      />
    </group>
  );
}

// ─── Public component — renders funnel at a single interpolated position ─────
export default function TornadoVis({
  lat,
  lng,
  width_m,
  centerLat,
  centerLng,
}: TornadoVisProps) {
  const [x, z]  = latLngToLocal(lat, lng, centerLat, centerLng);
  const funnelPos: [number, number, number] = [x, 0, z];

  return (
    <group name="tornado">
      <TornadoFunnel position={funnelPos} width_m={width_m} />
    </group>
  );
}
