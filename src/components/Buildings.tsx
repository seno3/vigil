'use client';

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Building, DamageLevel } from '@/types';
import { latLngToLocal } from '@/lib/geo';

const DAMAGE_COLORS: Record<DamageLevel | 'default', string> = {
  default: '#4a5568',
  intact: '#4a5568',
  minor: '#ecc94b',
  major: '#ed8936',
  destroyed: '#e53e3e',
};

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

function BuildingMesh({ building, damage, centerLat, centerLng }: BuildingMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const { geometry, position, rotation } = useMemo(() => {
    const height = building.levels * 3.5;
    const poly = building.polygon;

    let geom: THREE.BufferGeometry;
    let pos: [number, number, number];
    let rot: [number, number, number] = [0, 0, 0];

    if (poly.length >= 3 && poly.length <= 16) {
      // Use Shape + ExtrudeGeometry for the polygon footprint
      try {
        const shape = new THREE.Shape();
        const pts = poly.map(([lat, lng]) => latLngToLocal(lat, lng, centerLat, centerLng));

        shape.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) {
          shape.lineTo(pts[i][0], pts[i][1]);
        }
        shape.closePath();

        const extrudeSettings = {
          depth: height,
          bevelEnabled: false,
        };

        geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        // ExtrudeGeometry extrudes along Z — rotate so it extrudes along Y (up)
        geom.rotateX(-Math.PI / 2);

        const [cx, cz] = latLngToLocal(building.centroid.lat, building.centroid.lng, centerLat, centerLng);
        pos = [cx, 0, cz];
      } catch {
        // Fallback to box
        const [cx, cz] = latLngToLocal(building.centroid.lat, building.centroid.lng, centerLat, centerLng);
        const side = Math.sqrt(building.area_sqm);
        geom = new THREE.BoxGeometry(side, height, side);
        pos = [cx, height / 2, cz];
      }
    } else {
      // Box geometry fallback
      const [cx, cz] = latLngToLocal(building.centroid.lat, building.centroid.lng, centerLat, centerLng);
      const side = Math.sqrt(building.area_sqm);
      geom = new THREE.BoxGeometry(side, height, side);
      pos = [cx, height / 2, cz];
    }

    if (damage === 'destroyed') {
      rot = [(Math.random() - 0.5) * 0.3, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.3];
    }

    return { geometry: geom, position: pos, rotation: rot };
  }, [building, centerLat, centerLng, damage]);

  const color = DAMAGE_COLORS[damage ?? 'default'];
  const emissiveIntensity = damage === 'destroyed' ? 0.3 : damage === 'major' ? 0.15 : 0.05;

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={position}
      rotation={rotation}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={emissiveIntensity}
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
