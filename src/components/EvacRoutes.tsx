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

function RoadLine({
  geometry,
  color,
  opacity = 1,
  linewidth = 2,
  elevated = 2,
}: {
  geometry: [number, number][];
  color: string;
  opacity?: number;
  linewidth?: number;
  elevated?: number;
}) {
  const points = geometry.map(([lat, lng]) => new THREE.Vector3(0, 0, 0)); // placeholder
  // We'll use a tube instead of Line for visibility
  const tubeGeom = useMemo(() => {
    if (geometry.length < 2) return null;
    const pts = geometry.map(([lat, lng]) => {
      // We'll receive pre-converted coords, but here we handle raw lat/lng
      return new THREE.Vector3(lat, elevated, lng);
    });
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, Math.max(geometry.length * 2, 8), 2, 4, false);
  }, [geometry, elevated]);

  if (!tubeGeom) return null;

  return (
    <mesh geometry={tubeGeom}>
      <meshStandardMaterial
        color={color}
        transparent
        opacity={opacity}
        emissive={color}
        emissiveIntensity={0.4}
      />
    </mesh>
  );
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
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.15;
      meshRef.current.scale.setScalar(scale);
    }
  });

  const color = type === 'hospital' ? '#ef4444' : '#22d3ee';

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[12, 8, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* Outer ring */}
      <mesh>
        <torusGeometry args={[20, 2, 8, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          transparent
          opacity={0.5}
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

        const pts = localGeom.map(([x, z]) => new THREE.Vector3(x, 3, z));
        const curve = new THREE.CatmullRomCurve3(pts);
        const tubeGeom = new THREE.TubeGeometry(curve, Math.max(localGeom.length * 2, 8), isBlocked ? 3 : 2, 4, false);
        const color = isBlocked ? '#ef4444' : '#4ade80';

        return { id: road.id, tubeGeom, color, isBlocked };
      })
      .filter(Boolean);
  }, [roads, evacuationRoadIds, blockedSet, centerLat, centerLng]);

  const shelterPositions = useMemo(() => {
    return infrastructure
      .filter((i) => i.type === 'hospital' || i.type === 'shelter' || i.type === 'school')
      .map((i) => {
        const [x, z] = latLngToLocal(i.position.lat, i.position.lng, centerLat, centerLng);
        return { id: i.id, position: [x, 0, z] as [number, number, number], type: i.type };
      });
  }, [infrastructure, centerLat, centerLng]);

  return (
    <group name="evac-routes">
      {roadElements.map((el) =>
        el ? (
          <mesh key={el.id} geometry={el.tubeGeom}>
            <meshStandardMaterial
              color={el.color}
              emissive={el.color}
              emissiveIntensity={0.5}
              transparent
              opacity={0.85}
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
