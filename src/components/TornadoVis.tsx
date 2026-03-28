'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PathSegment } from '@/types';
import { latLngToLocal } from '@/lib/geo';

interface TornadoVisProps {
  pathSegments: PathSegment[];
  centerLat: number;
  centerLng: number;
}

function TornadoFunnel({ position, width_m }: { position: [number, number, number]; width_m: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const debrisRef = useRef<THREE.Points>(null);

  const { funnelGeom, debrisGeom } = useMemo(() => {
    const radius = Math.min(width_m * 0.5, 200);
    const height = 600;

    // Funnel: inverted cone (narrow at bottom, wide at top)
    const funnelG = new THREE.ConeGeometry(radius, height, 16, 1, true);

    // Debris particles
    const count = 200;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius * 1.5;
      const h = Math.random() * height;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = h;
      positions[i * 3 + 2] = Math.sin(angle) * r;
    }
    const debrisG = new THREE.BufferGeometry();
    debrisG.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    return { funnelGeom: funnelG, debrisGeom: debrisG };
  }, [width_m]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 3;
    }
    if (debrisRef.current) {
      debrisRef.current.rotation.y -= delta * 5;
    }
  });

  return (
    <group position={position}>
      <group ref={groupRef}>
        <mesh geometry={funnelGeom} position={[0, 300, 0]}>
          <meshStandardMaterial
            color="#4a1a1a"
            transparent
            opacity={0.75}
            side={THREE.DoubleSide}
            wireframe={false}
          />
        </mesh>
        {/* Inner glow cone */}
        <mesh geometry={funnelGeom} position={[0, 300, 0]}>
          <meshStandardMaterial
            color="#ef4444"
            transparent
            opacity={0.15}
            side={THREE.DoubleSide}
            emissive="#ef4444"
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>
      <points ref={debrisRef} geometry={debrisGeom}>
        <pointsMaterial
          color="#8b4513"
          size={3}
          transparent
          opacity={0.8}
          sizeAttenuation
        />
      </points>
    </group>
  );
}

function PathTrail({
  pathSegments,
  centerLat,
  centerLng,
}: {
  pathSegments: PathSegment[];
  centerLat: number;
  centerLng: number;
}) {
  const points = useMemo(() => {
    return pathSegments.map((seg) => {
      const [x, z] = latLngToLocal(seg.lat, seg.lng, centerLat, centerLng);
      return new THREE.Vector3(x, 1, z);
    });
  }, [pathSegments, centerLat, centerLng]);

  const tubeGeom = useMemo(() => {
    if (points.length < 2) return null;
    const curve = new THREE.CatmullRomCurve3(points);
    const maxWidth = Math.max(...pathSegments.map((s) => s.width_m)) * 0.5;
    return new THREE.TubeGeometry(curve, 64, Math.min(maxWidth, 150), 8, false);
  }, [points, pathSegments]);

  if (!tubeGeom) return null;

  return (
    <mesh geometry={tubeGeom}>
      <meshStandardMaterial
        color="#ef4444"
        transparent
        opacity={0.25}
        emissive="#ef4444"
        emissiveIntensity={0.3}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export default function TornadoVis({ pathSegments, centerLat, centerLng }: TornadoVisProps) {
  if (!pathSegments || pathSegments.length === 0) return null;

  const midIndex = Math.floor(pathSegments.length / 2);
  const midSeg = pathSegments[midIndex];
  const [mx, mz] = latLngToLocal(midSeg.lat, midSeg.lng, centerLat, centerLng);
  const funnelPos: [number, number, number] = [mx, 0, mz];

  return (
    <group name="tornado">
      <PathTrail pathSegments={pathSegments} centerLat={centerLat} centerLng={centerLng} />
      <TornadoFunnel position={funnelPos} width_m={midSeg.width_m} />
    </group>
  );
}
