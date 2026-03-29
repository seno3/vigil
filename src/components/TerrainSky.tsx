'use client';

import { useLayoutEffect, useMemo, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { Sky, Cloud } from '@react-three/drei';
import * as THREE from 'three';

/** Procedural grass / soil texture + subtle height variation (client-only) */
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
        Math.sin(x * 0.08) * Math.cos(y * 0.07) * 0.15 +
        Math.sin(x * 0.02 + y * 0.03) * 0.25 +
        Math.random() * 0.12;
      const g = 0.32 + n * 0.18;
      const r = g * 0.55 + 0.08;
      const b = g * 0.35 + 0.05;
      img.data[i] = Math.min(255, r * 255);
      img.data[i + 1] = Math.min(255, g * 255);
      img.data[i + 2] = Math.min(255, b * 255);
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

interface TerrainGroundProps {
  size?: number;
  segments?: number;
}

export function TerrainGround({ size = 3200, segments = 96 }: TerrainGroundProps) {
  const [maps, setMaps] = useState<{ map: THREE.Texture; roughMap: THREE.Texture } | null>(null);
  useLayoutEffect(() => {
    setMaps(createGroundTextures());
  }, []);

  const geometry = useMemo(() => {
    const geom = new THREE.PlaneGeometry(size, size, segments, segments);
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
  }, [size, segments]);

  return (
    <mesh position={[0, -0.2, 0]} receiveShadow geometry={geometry}>
      <meshStandardMaterial
        map={maps?.map}
        roughnessMap={maps?.roughMap}
        color={maps ? '#ffffff' : '#4d6b4a'}
        roughness={0.92}
        metalness={0.02}
        envMapIntensity={0.35}
      />
    </mesh>
  );
}

/** Atmospheric sky, sun, soft clouds, exponential fog */
export function Atmosphere() {
  const { scene } = useThree();

  useLayoutEffect(() => {
    const fog = new THREE.FogExp2('#b8c9dc', 0.00022);
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
      <hemisphereLight color="#c8daf0" groundColor="#3d4a35" intensity={0.55} />
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
