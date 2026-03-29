'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Road, Infrastructure, EvacuationRoute } from '@/types';
import { latLngToLocal } from '@/lib/geo';

interface EvacRoutesProps {
  roads: Road[];
  evacuationRoutes: EvacuationRoute[];
  blockedRoads: string[];
  infrastructure: Infrastructure[];
  centerLat: number;
  centerLng: number;
}

function ShelterMarker({
  position,
  type,
}: {
  position: [number, number, number];
  type: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.12;
      meshRef.current.scale.setScalar(scale);
    }
  });

  const color =
    type === 'hospital'
      ? '#f87171'
      : type === 'school'
        ? '#fbbf24'
        : type === 'fire_station'
          ? '#fb923c'
          : '#22d3ee';

  return (
    <group position={[position[0], 0, position[2]]}>
      {/* Pole */}
      <mesh position={[0, 14, 0]} castShadow>
        <cylinderGeometry args={[0.45, 0.55, 28, 8]} />
        <meshStandardMaterial color="#2d3748" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* Beacon */}
      <mesh ref={meshRef} position={[0, 30, 0]} castShadow>
        <sphereGeometry args={[9, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.55}
          transparent
          opacity={0.92}
          roughness={0.35}
        />
      </mesh>
      <mesh position={[0, 30, 0]}>
        <torusGeometry args={[16, 1.2, 8, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.35}
          transparent
          opacity={0.45}
        />
      </mesh>
    </group>
  );
}

export default function EvacRoutes({
  roads,
  evacuationRoutes,
  blockedRoads,
  infrastructure,
  centerLat,
  centerLng,
}: EvacRoutesProps) {
  const evacuationRoadIds = new Set(evacuationRoutes.flatMap((r) => r.road_ids));
  const blockedSet = new Set(blockedRoads);

  const roadElements = useMemo(() => {
    return roads
      .filter((r) => evacuationRoadIds.has(r.id) || blockedSet.has(r.id))
      .map((road) => {
        const localGeom = road.geometry.map(([lat, lng]) => {
          const [x, z] = latLngToLocal(lat, lng, centerLat, centerLng);
          return [x, z] as [number, number];
        });

        const isBlocked = blockedSet.has(road.id);
        const isEvac = evacuationRoadIds.has(road.id);

        if (localGeom.length < 2) return null;

        const pts = localGeom.map(([x, z]) => new THREE.Vector3(x, 4.2, z));
        const curve = new THREE.CatmullRomCurve3(pts);
        const tubeGeom = new THREE.TubeGeometry(
          curve,
          Math.max(localGeom.length * 2, 10),
          isBlocked ? 3.8 : 2.8,
          10,
          false
        );
        const color = isBlocked ? '#f87171' : '#4ade80';

        return { id: road.id, tubeGeom, color, isBlocked };
      })
      .filter(Boolean);
  }, [roads, evacuationRoadIds, blockedSet, centerLat, centerLng]);

  const shelterPositions = useMemo(() => {
    return infrastructure
      .filter(
        (i) =>
          i.type === 'hospital' ||
          i.type === 'shelter' ||
          i.type === 'school' ||
          i.type === 'fire_station'
      )
      .map((i) => {
        const [x, z] = latLngToLocal(i.position.lat, i.position.lng, centerLat, centerLng);
        return { id: i.id, position: [x, 0, z] as [number, number, number], type: i.type };
      });
  }, [infrastructure, centerLat, centerLng]);

  return (
    <group name="evac-routes">
      {roadElements.map((el) =>
        el ? (
          <mesh key={el.id} geometry={el.tubeGeom} castShadow>
            <meshStandardMaterial
              color={el.color}
              emissive={el.color}
              emissiveIntensity={0.35}
              transparent
              opacity={0.88}
              roughness={0.45}
              metalness={0.15}
              envMapIntensity={0.6}
            />
          </mesh>
        ) : null
      )}
      {shelterPositions.map((s) => (
        <ShelterMarker key={s.id} position={s.position} type={s.type} />
      ))}
    </group>
  );
}
