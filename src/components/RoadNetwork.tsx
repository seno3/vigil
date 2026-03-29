'use client';

import { useLayoutEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Road } from '@/types';
import { latLngToLocal } from '@/lib/geo';
import { createAsphaltTextures, createRoadEdgeTexture } from '@/lib/proceduralTextures';
import { FLAT_SURFACE_Y } from '@/lib/sceneHeights';

function roadWidthM(type: string): number {
  const t = type.toLowerCase();
  if (t === 'primary' || t === 'trunk' || t === 'motorway') return 13;
  if (t === 'secondary') return 10;
  if (t === 'tertiary') return 8;
  if (t === 'residential' || t === 'living_street') return 6.5;
  if (t === 'service' || t === 'track') return 4.5;
  return 7;
}

/** Meters per full UV tile along the road (asphalt texture repeat) */
const ASPHALT_U_METERS = 4.5;

/**
 * Flat ribbon with UVs: U along path length (tiled), V across width (0–1).
 */
function buildRibbon(
  pts: THREE.Vector3[],
  halfWidth: number,
  yElev: number,
  uScaleMeters: number
): THREE.BufferGeometry | null {
  if (pts.length < 2) return null;

  const vertices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];

  let uAccum = 0;

  for (let i = 0; i < pts.length - 1; i++) {
    const p = new THREE.Vector3(pts[i].x, yElev, pts[i].z);
    const q = new THREE.Vector3(pts[i + 1].x, yElev, pts[i + 1].z);
    const dir = new THREE.Vector3().subVectors(q, p);
    const segLen = Math.hypot(dir.x, dir.z);
    if (segLen < 1e-6) continue;
    dir.multiplyScalar(1 / segLen);
    const perp = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(halfWidth);

    const a = new THREE.Vector3().addVectors(p, perp);
    const b = new THREE.Vector3().subVectors(p, perp);
    const c = new THREE.Vector3().subVectors(q, perp);
    const d = new THREE.Vector3().addVectors(q, perp);

    const u0 = uAccum / uScaleMeters;
    const u1 = (uAccum + segLen) / uScaleMeters;
    uAccum += segLen;

    const pushTri = (
      v1: THREE.Vector3,
      v2: THREE.Vector3,
      v3: THREE.Vector3,
      uv1: [number, number],
      uv2: [number, number],
      uv3: [number, number]
    ) => {
      vertices.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, v3.x, v3.y, v3.z);
      const n = new THREE.Vector3(0, 1, 0);
      normals.push(n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z);
      uvs.push(uv1[0], uv1[1], uv2[0], uv2[1], uv3[0], uv3[1]);
    };

    pushTri(a, b, c, [u0, 0], [u0, 1], [u1, 1]);
    pushTri(a, c, d, [u0, 0], [u1, 1], [u1, 0]);
  }

  if (vertices.length === 0) return null;
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.computeVertexNormals();
  return geom;
}

interface RoadNetworkProps {
  roads: Road[];
  centerLat: number;
  centerLng: number;
  /** Slightly lift above terrain to avoid z-fighting */
  yOffset?: number;
}

export default function RoadNetwork({
  roads,
  centerLat,
  centerLng,
  yOffset = FLAT_SURFACE_Y,
}: RoadNetworkProps) {
  const [textures, setTextures] = useState<{
    asphalt: ReturnType<typeof createAsphaltTextures>;
    edge: THREE.CanvasTexture;
  } | null>(null);

  useLayoutEffect(() => {
    if (typeof document === 'undefined') return;
    setTextures({
      asphalt: createAsphaltTextures(),
      edge: createRoadEdgeTexture(),
    });
  }, []);

  const { geometry, edgeGeometry } = useMemo(() => {
    const geoms: THREE.BufferGeometry[] = [];
    const edges: THREE.BufferGeometry[] = [];

    for (const road of roads) {
      if (road.geometry.length < 2) continue;
      const pts = road.geometry.map(([lat, lng]) => {
        const [x, z] = latLngToLocal(lat, lng, centerLat, centerLng);
        return new THREE.Vector3(x, yOffset, z);
      });
      const w = roadWidthM(road.type) * 0.5;
      const g = buildRibbon(pts, w, yOffset, ASPHALT_U_METERS);
      if (g) geoms.push(g);

      const wEdge = w + 0.35;
      const ge = buildRibbon(pts, wEdge, yOffset - 0.02, ASPHALT_U_METERS * 1.2);
      if (ge) edges.push(ge);
    }

    return {
      geometry: mergeGeoms(geoms),
      edgeGeometry: mergeGeoms(edges),
    };
  }, [roads, centerLat, centerLng, yOffset]);

  if (!geometry) return null;

  const edge = edgeGeometry ?? undefined;
  const { map, roughnessMap } = textures?.asphalt ?? {};
  const edgeMap = textures?.edge;

  return (
    <group name="road-network">
      {edge && (
        <mesh geometry={edge} receiveShadow>
          <meshStandardMaterial
            map={edgeMap}
            color="#1e2228"
            roughness={0.96}
            metalness={0.03}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
      )}
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial
          map={map}
          roughnessMap={roughnessMap}
          color={map ? '#ffffff' : '#3a3f47'}
          roughness={0.82}
          metalness={0.08}
          envMapIntensity={0.55}
          polygonOffset
          polygonOffsetFactor={2}
          polygonOffsetUnits={2}
        />
      </mesh>
    </group>
  );
}

function mergeGeoms(geoms: THREE.BufferGeometry[]): THREE.BufferGeometry | null {
  if (geoms.length === 0) return null;
  if (geoms.length === 1) return geoms[0];
  return mergeGeometries(geoms, false);
}
