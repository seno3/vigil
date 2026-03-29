'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Building, DamageLevel } from '@/types';
import { latLngToLocal } from '@/lib/geo';

interface BuildingsProps {
  buildings: Building[];
  damageLevels: Record<string, DamageLevel>;
  centerLat: number;
  centerLng: number;
}

interface BuildingMeshProps {
  building: Building;
  damage: DamageLevel | undefined;
  centerLat: number;
  centerLng: number;
}

// Intact buildings are invisible — Street View shows the real structure.
// Damaged buildings appear as semi-transparent colored overlays.
const DAMAGE_CONFIG: Record<
  Exclude<DamageLevel, 'intact'>,
  { color: string; opacity: number; emissive: number }
> = {
  minor:     { color: '#ecc94b', opacity: 0.35, emissive: 0.10 },
  major:     { color: '#f97316', opacity: 0.50, emissive: 0.20 },
  destroyed: { color: '#ef4444', opacity: 0.70, emissive: 0.35 },
};

function BuildingMesh({ building, damage, centerLat, centerLng }: BuildingMeshProps) {
  const matRef  = useRef<THREE.MeshStandardMaterial>(null);
  const seedRef = useRef(Math.random() * Math.PI * 2);

  // Flicker emissive intensity on destroyed buildings
  useFrame(({ clock }) => {
    if (!matRef.current || damage !== 'destroyed') return;
    matRef.current.emissiveIntensity =
      0.35 + Math.sin(clock.getElapsedTime() * 9 + seedRef.current) * 0.18;
  });

  // Intact buildings are invisible — nothing to render
  if (!damage || damage === 'intact') return null;

  const cfg = DAMAGE_CONFIG[damage];

  const { geometry, position, rotation } = useMemo(() => {
    const height = building.levels * 3.5;
    const poly   = building.polygon;

    let geom: THREE.BufferGeometry;
    let pos: [number, number, number];
    let rot: [number, number, number] = [0, 0, 0];

    if (poly.length >= 3 && poly.length <= 16) {
      try {
        const shape = new THREE.Shape();
        const pts   = poly.map(([lat, lng]) => latLngToLocal(lat, lng, centerLat, centerLng));

        shape.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) {
          shape.lineTo(pts[i][0], pts[i][1]);
        }
        shape.closePath();

        geom = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
        geom.rotateX(-Math.PI / 2);

        const [cx, cz] = latLngToLocal(building.centroid.lat, building.centroid.lng, centerLat, centerLng);
        pos = [cx, 0, cz];
      } catch {
        const [cx, cz] = latLngToLocal(building.centroid.lat, building.centroid.lng, centerLat, centerLng);
        const side = Math.sqrt(building.area_sqm);
        geom = new THREE.BoxGeometry(side, height, side);
        pos  = [cx, height / 2, cz];
      }
    } else {
      const [cx, cz] = latLngToLocal(building.centroid.lat, building.centroid.lng, centerLat, centerLng);
      const side = Math.sqrt(building.area_sqm);
      geom = new THREE.BoxGeometry(side, height, side);
      pos  = [cx, height / 2, cz];
    }

    if (damage === 'destroyed') {
      rot = [
        (Math.random() - 0.5) * 0.3,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.3,
      ];
    }

    return { geometry: geom, position: pos, rotation: rot };
  // damage is intentionally excluded — rotation is baked at mount time
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [building, centerLat, centerLng]);

  return (
    <mesh
      geometry={geometry}
      position={position}
      rotation={rotation}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        ref={matRef}
        color={cfg.color}
        emissive={cfg.color}
        emissiveIntensity={cfg.emissive}
        transparent
        opacity={cfg.opacity}
        depthWrite={false}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
}

export default function Buildings({ buildings, damageLevels, centerLat, centerLng }: BuildingsProps) {
  return (
    <group name="buildings">
      {buildings.map((building) => (
        <BuildingMesh
          key={building.id}
          building={building}
          damage={damageLevels[building.id]}
          centerLat={centerLat}
          centerLng={centerLng}
        />
      ))}
    </group>
  );
}
