'use client';

import { useLayoutEffect, useMemo, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { Sky, Cloud } from '@react-three/drei';
import * as THREE from 'three';

/** Procedural neutral gray variation (in-bounds ground) — client-only */
function createGroundTextures(): { map: THREE.Texture; roughMap: THREE.Texture } {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const n =
        Math.sin(x * 0.08) * Math.cos(y * 0.07) * 0.12 +
        Math.sin(x * 0.02 + y * 0.03) * 0.18 +
        Math.random() * 0.08;
      const v = 0.72 + n * 0.14;
      const c = Math.min(255, Math.max(0, v * 255));
      img.data[i] = img.data[i + 1] = img.data[i + 2] = c;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(24, 24);
  map.anisotropy = 8;

  const rough = document.createElement('canvas');
  rough.width = rough.height = 256;
  const rctx = rough.getContext('2d')!;
  const rimg = rctx.createImageData(256, 256);
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const i = (y * 256 + x) * 4;
      const v = 120 + Math.random() * 80;
      rimg.data[i] = rimg.data[i + 1] = rimg.data[i + 2] = v;
      rimg.data[i + 3] = 255;
    }
  }
  rctx.putImageData(rimg, 0, 0);
  const roughMap = new THREE.CanvasTexture(rough);
  roughMap.wrapS = roughMap.wrapT = THREE.RepeatWrapping;
  roughMap.repeat.set(40, 40);

  return { map, roughMap };
}

/** Gray “out of scope” ground extends to this radius (meters) — very large so edges stay beyond fog + orbit limit */
const OUT_OF_SCOPE_OUTER_M = 220_000;

interface TerrainGroundProps {
  /** Simulation / OSM query radius — textured grass terrain is limited to this disk at scene origin */
  scopeRadiusM: number;
  /** Angular segments for the in-scope disk */
  segments?: number;
}

export function TerrainGround({ scopeRadiusM, segments = 112 }: TerrainGroundProps) {
  const [maps, setMaps] = useState<{ map: THREE.Texture; roughMap: THREE.Texture } | null>(null);
  useLayoutEffect(() => {
    setMaps(createGroundTextures());
  }, []);

  const innerGeometry = useMemo(() => {
    const geom = new THREE.CircleGeometry(scopeRadiusM, segments);
    geom.rotateX(-Math.PI / 2);
    const pos = geom.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const d = Math.sqrt(x * x + z * z);
      const roll =
        Math.sin(x * 0.004) * Math.cos(z * 0.0035) * 4 +
        Math.sin(x * 0.012 + z * 0.01) * 2.5 +
        Math.sin(d * 0.002) * 3;
      pos.setY(i, roll);
    }
    pos.needsUpdate = true;
    geom.computeVertexNormals();
    return geom;
  }, [scopeRadiusM, segments]);

  const outerRingGeometry = useMemo(() => {
    const geom = new THREE.RingGeometry(scopeRadiusM, OUT_OF_SCOPE_OUTER_M, 96, 1);
    geom.rotateX(-Math.PI / 2);
    return geom;
  }, [scopeRadiusM]);

  return (
    <group name="terrain-ground">
      <mesh
        position={[0, -0.23, 0]}
        receiveShadow
        geometry={outerRingGeometry}
        renderOrder={0}
      >
        <meshStandardMaterial
          color="#4a4f56"
          roughness={0.98}
          metalness={0.03}
          envMapIntensity={0.12}
          polygonOffset
          polygonOffsetFactor={2}
          polygonOffsetUnits={2}
        />
      </mesh>
      <mesh position={[0, -0.2, 0]} receiveShadow geometry={innerGeometry} renderOrder={1}>
        <meshStandardMaterial
          map={maps?.map}
          roughnessMap={maps?.roughMap}
          color={maps ? '#d8dce3' : '#d0d4db'}
          roughness={0.94}
          metalness={0.02}
          envMapIntensity={0.28}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>
    </group>
  );
}

/** Atmospheric sky, sun, soft clouds, exponential fog */
export function Atmosphere() {
  const { scene } = useThree();

  useLayoutEffect(() => {
    const fog = new THREE.FogExp2('#b8c9dc', 0.00026);
    scene.fog = fog;
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  return (
    <>
      <color attach="background" args={['#87a8c4']} />
      <Sky
        distance={450000}
        sunPosition={[280, 120, -180]}
        turbidity={6}
        rayleigh={1.8}
        mieCoefficient={0.0045}
        mieDirectionalG={0.77}
      />
      <Cloud position={[-380, 140, -520]} speed={0.15} opacity={0.52} segments={32} />
      <Cloud position={[420, 160, 380]} speed={0.12} opacity={0.45} segments={28} />
      <Cloud position={[120, 200, -280]} speed={0.18} opacity={0.38} segments={24} />
      <hemisphereLight color="#c8daf0" groundColor="#8e95a0" intensity={0.55} />
      <ambientLight intensity={0.28} color="#e8eef5" />
      <directionalLight
        position={[420, 720, 280]}
        intensity={1.35}
        color="#fff8ed"
        castShadow
        shadow-mapSize={[3072, 3072]}
        shadow-camera-near={50}
        shadow-camera-far={4000}
        shadow-camera-left={-1600}
        shadow-camera-right={1600}
        shadow-camera-top={1600}
        shadow-camera-bottom={-1600}
        shadow-bias={-0.00015}
      />
      <directionalLight position={[-280, 320, -420]} intensity={0.35} color="#ffd4b0" />
    </>
  );
}
