'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Road } from '@/types';
import { latLngToLocal } from '@/lib/geo';

function roadWidthM(type: string): number {
  const t = type.toLowerCase();
  if (t === 'primary' || t === 'trunk' || t === 'motorway') return 13;
  if (t === 'secondary') return 10;
  if (t === 'tertiary') return 8;
  if (t === 'residential' || t === 'living_street') return 6.5;
  if (t === 'service' || t === 'track') return 4.5;
  return 7;
}

/** Flat ribbon mesh along polyline (XZ plane, Y up) */
function buildRibbon(
  pts: THREE.Vector3[],
  halfWidth: number,
  yElev: number
): THREE.BufferGeometry | null {
  if (pts.length < 2) return null;

  const vertices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];

  for (let i = 0; i < pts.length - 1; i++) {
    const p = pts[i].clone();
    const q = pts[i + 1].clone();
    p.y = yElev;
    q.y = yElev;
    const dir = new THREE.Vector3().subVectors(q, p);
    const len = dir.length();
    if (len < 1e-6) continue;
    dir.multiplyScalar(1 / len);
    const perp = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(halfWidth);

    const a = new THREE.Vector3().addVectors(p, perp);
    const b = new THREE.Vector3().subVectors(p, perp);
    const c = new THREE.Vector3().subVectors(q, perp);
    const d = new THREE.Vector3().addVectors(q, perp);

    const pushQuad = (
      v1: THREE.Vector3,
      v2: THREE.Vector3,
      v3: THREE.Vector3,
      v4: THREE.Vector3,
      u0: number,
      u1: number
    ) => {
      const n = new THREE.Vector3(0, 1, 0);
      const pushTri = (x: THREE.Vector3, y: THREE.Vector3, z: THREE.Vector3, ua: number, ub: number, uc: number) => {
        vertices.push(x.x, x.y, x.z, y.x, y.y, y.z, z.x, z.y, z.z);
        normals.push(n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z);
        uvs.push(ua, 0, ub, 0, uc, 1);
      };
      pushTri(v1, v2, v3, u0, u0, u1);
      pushTri(v1, v3, v4, u0, u1, u1);
    };

    pushQuad(a, b, c, d, i * 0.2, (i + 1) * 0.2);
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

/**
 * Renders all roads as textured asphalt ribbons (base layer).
 * EvacRoutes can draw highlights on top for evacuation / blocked.
 */
export default function RoadNetwork({
  roads,
  centerLat,
  centerLng,
  yOffset = 0.35,
}: RoadNetworkProps) {
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
      const g = buildRibbon(pts, w, yOffset);
      if (g) geoms.push(g);

      const wEdge = w + 0.35;
      const ge = buildRibbon(pts, wEdge, yOffset - 0.02);
      if (ge) edges.push(ge);
    }

    return {
      geometry: mergeGeoms(geoms),
      edgeGeometry: mergeGeoms(edges),
    };
  }, [roads, centerLat, centerLng, yOffset]);

  if (!geometry) return null;

  const edge = edgeGeometry ?? undefined;

  return (
    <group name="road-network">
      {/* Curb / shoulder edge (darker strip) */}
      {edge && (
        <mesh geometry={edge} receiveShadow>
          <meshStandardMaterial
            color="#2a2e33"
            roughness={0.95}
            metalness={0.02}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
      )}
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial
          color="#3a3f47"
          roughness={0.88}
          metalness={0.06}
          polygonOffset
          polygonOffsetFactor={2}
          polygonOffsetUnits={2}
        />
      </mesh>
      {/* Center dashed line approximation — thin lighter strip via second pass would be heavy; skip for perf */}
    </group>
  );
}

function mergeGeoms(geoms: THREE.BufferGeometry[]): THREE.BufferGeometry | null {
  if (geoms.length === 0) return null;
  if (geoms.length === 1) return geoms[0];
  return mergeGeometries(geoms, false);
}
