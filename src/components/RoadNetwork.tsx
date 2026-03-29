'use client';

import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Road } from '@/types';
import { distanceMeters, latLngToLocal } from '@/lib/geo';
import { createAsphaltTextures, createRoadEdgeTexture } from '@/lib/proceduralTextures';
import { ROAD_SURFACE_Y } from '@/lib/sceneHeights';

function roadWidthM(type: string): number {
  const t = type.toLowerCase();
  if (t === 'primary' || t === 'trunk' || t === 'motorway') return 13;
  if (t === 'secondary') return 10;
  if (t === 'tertiary') return 8;
  if (t === 'residential' || t === 'living_street') return 6.5;
  if (t === 'service' || t === 'track') return 4.5;
  return 7;
}

const ASPHALT_U_METERS = 4.5;

/** Drop duplicate / micro-segments so ribbons don't collapse to zero-area tris. */
function dedupeRoadPoints(geometry: [number, number][], minM = 0.4): [number, number][] {
  if (geometry.length < 2) return geometry;
  const out: [number, number][] = [geometry[0]];
  for (let i = 1; i < geometry.length; i++) {
    const [lat, lng] = geometry[i];
    const [plat, plng] = out[out.length - 1];
    if (distanceMeters(plat, plng, lat, lng) >= minM) {
      out.push([lat, lng]);
    }
  }
  if (out.length < 2) return [geometry[0], geometry[geometry.length - 1]];
  return out;
}

function buildRibbon(
  pts: THREE.Vector3[],
  halfWidth: number,
  yElev: number,
  uScaleMeters: number,
): THREE.BufferGeometry | null {
  if (pts.length < 2) return null;

  const hw = Math.max(halfWidth, 2.5);

  const vertices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];

  let uAccum = 0;

  for (let i = 0; i < pts.length - 1; i++) {
    const p = new THREE.Vector3(pts[i].x, yElev, pts[i].z);
    const q = new THREE.Vector3(pts[i + 1].x, yElev, pts[i + 1].z);
    const dir = new THREE.Vector3().subVectors(q, p);
    const segLen = Math.hypot(dir.x, dir.z);
    if (segLen < 1e-5) continue;
    dir.multiplyScalar(1 / segLen);
    const perp = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(hw);

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
      uv3: [number, number],
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
  yOffset?: number;
}

export default function RoadNetwork({
  roads,
  centerLat,
  centerLng,
  yOffset = ROAD_SURFACE_Y,
}: RoadNetworkProps) {
  const [textures, setTextures] = useState<{
    asphalt: ReturnType<typeof createAsphaltTextures>;
    edge: THREE.CanvasTexture;
  } | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    setTextures({
      asphalt: createAsphaltTextures(),
      edge: createRoadEdgeTexture(),
    });
  }, []);

  const segments = useMemo(() => {
    const main: { id: string; geom: THREE.BufferGeometry }[] = [];
    const edge: { id: string; geom: THREE.BufferGeometry }[] = [];

    for (const road of roads) {
      const coords = dedupeRoadPoints(road.geometry);
      if (coords.length < 2) continue;

      const pts = coords.map(([lat, lng]) => {
        const [x, z] = latLngToLocal(lat, lng, centerLat, centerLng);
        return new THREE.Vector3(x, yOffset, z);
      });

      const w = Math.max(roadWidthM(road.type) * 0.5, 2.5);
      const g = buildRibbon(pts, w, yOffset, ASPHALT_U_METERS);
      if (g) main.push({ id: road.id, geom: g });

      const ge = buildRibbon(pts, w + 0.45, yOffset - 0.06, ASPHALT_U_METERS * 1.2);
      if (ge) edge.push({ id: `${road.id}-edge`, geom: ge });
    }

    return { main, edge };
  }, [roads, centerLat, centerLng, yOffset]);

  const asphaltMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: 0xb8c2d0,
      roughness: 0.72,
      metalness: 0.06,
      envMapIntensity: 0.7,
      side: THREE.DoubleSide,
    });
    return m;
  }, []);

  const edgeMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: 0x2a3038,
      roughness: 0.9,
      metalness: 0.04,
      side: THREE.DoubleSide,
    });
    return m;
  }, []);

  useEffect(() => {
    if (!textures) return;
    asphaltMat.map = textures.asphalt.map;
    asphaltMat.roughnessMap = textures.asphalt.roughnessMap;
    asphaltMat.color.setHex(0xffffff);
    asphaltMat.needsUpdate = true;
    edgeMat.map = textures.edge;
    edgeMat.needsUpdate = true;
    return () => {
      asphaltMat.map = null;
      asphaltMat.roughnessMap = null;
      edgeMat.map = null;
    };
  }, [textures, asphaltMat, edgeMat]);

  useEffect(() => {
    return () => {
      segments.main.forEach(({ geom }) => geom.dispose());
      segments.edge.forEach(({ geom }) => geom.dispose());
    };
  }, [segments]);

  useEffect(() => {
    return () => {
      asphaltMat.dispose();
      edgeMat.dispose();
    };
  }, [asphaltMat, edgeMat]);

  if (segments.main.length === 0) return null;

  return (
    <group name="road-network" renderOrder={10}>
      {segments.edge.map(({ id, geom }) => (
        <mesh key={id} geometry={geom} material={edgeMat} receiveShadow renderOrder={10} />
      ))}
      {segments.main.map(({ id, geom }) => (
        <mesh key={id} geometry={geom} material={asphaltMat} receiveShadow renderOrder={11} />
      ))}
    </group>
  );
}
