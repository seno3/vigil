'use client';

import { useLayoutEffect, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { WaterFeature, WaterCategory } from '@/types';
import { latLngToLocal, worldDeltaToShapeXY } from '@/lib/geo';
import {
  createWaterTextures,
  createRiverWaterTextures,
  createOceanWaterTextures,
} from '@/lib/proceduralTextures';
import { WATER_SURFACE_Y } from '@/lib/sceneHeights';

const LAKE_U_METERS = 6;
const RIVER_U_METERS = 4.5;
const OCEAN_LINE_U_METERS = 11;
/** UV scale along coast / ocean ribbon */
const OCEAN_COAST_U_METERS = 28;
/** How far offshore the ocean mesh extends (meters) — OSM coastline + band toward sea */
const OCEAN_BAND_WIDTH_M = 2800;

function catOf(f: WaterFeature): WaterCategory {
  return f.category ?? 'lake';
}

function waterLineHalfWidthM(type: string, category: WaterCategory): number {
  if (category === 'ocean') return 24;
  const t = type.toLowerCase();
  if (t === 'river') return 20;
  if (t === 'canal') return 16;
  if (t === 'stream') return 9;
  if (t === 'ditch' || t === 'drain') return 4;
  return 11;
}

/** River / stream / canal ribbon — U along path */
function buildWaterRibbon(
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

/**
 * Expand OSM coastline toward open water.
 * OSM: land on the **left** of the way (node order) → sea on the **right**.
 * With Y up: left = up × forward = (fz, -fx), sea = -left = (-fz, fx) in XZ.
 */
function buildCoastlineOceanBand(
  ring: [number, number][],
  centerLat: number,
  centerLng: number,
  yElev: number,
  bandWidth: number,
  uScaleMeters: number
): THREE.BufferGeometry | null {
  if (ring.length < 2) return null;

  const vertices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  let uAccum = 0;

  for (let i = 0; i < ring.length - 1; i++) {
    const [la0, ln0] = ring[i];
    const [la1, ln1] = ring[i + 1];
    const [x0, z0] = latLngToLocal(la0, ln0, centerLat, centerLng);
    const [x1, z1] = latLngToLocal(la1, ln1, centerLat, centerLng);
    const dx = x1 - x0;
    const dz = z1 - z0;
    const len = Math.hypot(dx, dz);
    if (len < 1e-6) continue;
    const fx = dx / len;
    const fz = dz / len;
    const sx = -fz;
    const sz = fx;

    const p0 = new THREE.Vector3(x0, yElev, z0);
    const p1 = new THREE.Vector3(x1, yElev, z1);
    const s0 = new THREE.Vector3(x0 + sx * bandWidth, yElev, z0 + sz * bandWidth);
    const s1 = new THREE.Vector3(x1 + sx * bandWidth, yElev, z1 + sz * bandWidth);

    const u0 = uAccum / uScaleMeters;
    const u1 = (uAccum + len) / uScaleMeters;
    uAccum += len;

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

    pushTri(p0, p1, s1, [u0, 0], [u1, 0], [u1, 1]);
    pushTri(p0, s1, s0, [u0, 0], [u1, 1], [u0, 1]);
  }

  if (vertices.length === 0) return null;
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.computeVertexNormals();
  return geom;
}

function buildWaterArea(
  poly: [number, number][],
  centerLat: number,
  centerLng: number,
  ySurf: number
): { geometry: THREE.BufferGeometry; position: [number, number, number] } | null {
  let ring = poly;
  if (ring.length > 2) {
    const a = ring[0];
    const b = ring[ring.length - 1];
    if (a[0] === b[0] && a[1] === b[1]) ring = ring.slice(0, -1);
  }
  if (ring.length < 3) return null;

  const cLat = ring.reduce((s, p) => s + p[0], 0) / ring.length;
  const cLng = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  const [cx, cz] = latLngToLocal(cLat, cLng, centerLat, centerLng);

  const shape = new THREE.Shape();
  const [w0x, w0z] = latLngToLocal(ring[0][0], ring[0][1], centerLat, centerLng);
  const [s0x, s0y] = worldDeltaToShapeXY(w0x - cx, w0z - cz);
  shape.moveTo(s0x, s0y);
  for (let i = 1; i < ring.length; i++) {
    const [wx, wz] = latLngToLocal(ring[i][0], ring[i][1], centerLat, centerLng);
    const [sx, sy] = worldDeltaToShapeXY(wx - cx, wz - cz);
    shape.lineTo(sx, sy);
  }
  shape.closePath();

  const geom = new THREE.ShapeGeometry(shape);
  geom.rotateX(-Math.PI / 2);
  geom.computeVertexNormals();
  geom.computeBoundingBox();
  const minY = geom.boundingBox!.min.y;
  geom.translate(0, ySurf - minY, 0);

  return { geometry: geom, position: [cx, 0, cz] };
}

function mergeGeoms(geoms: THREE.BufferGeometry[]): THREE.BufferGeometry | null {
  if (geoms.length === 0) return null;
  if (geoms.length === 1) return geoms[0];
  return mergeGeometries(geoms, false);
}

type TexSet = { map: THREE.CanvasTexture; normalMap: THREE.CanvasTexture };

interface WaterFeaturesProps {
  features: WaterFeature[];
  centerLat: number;
  centerLng: number;
  ySurface?: number;
}

const lakeMat = {
  color: '#ffffff',
  roughness: 0.09,
  metalness: 0.02,
  transmission: 0.18,
  thickness: 0.8,
  ior: 1.33,
  transparent: true,
  opacity: 0.94,
  envMapIntensity: 1.15,
} as const;

const riverMat = {
  color: '#ffffff',
  roughness: 0.14,
  metalness: 0.03,
  transmission: 0.12,
  thickness: 0.55,
  ior: 1.33,
  transparent: true,
  opacity: 0.93,
  envMapIntensity: 0.95,
} as const;

const oceanMat = {
  color: '#ffffff',
  roughness: 0.055,
  metalness: 0.04,
  transmission: 0.26,
  thickness: 1.1,
  ior: 1.34,
  transparent: true,
  opacity: 0.96,
  envMapIntensity: 1.35,
} as const;

export default function WaterFeatures({
  features,
  centerLat,
  centerLng,
  ySurface = WATER_SURFACE_Y,
}: WaterFeaturesProps) {
  const [textures, setTextures] = useState<{
    lake: TexSet;
    river: TexSet;
    ocean: TexSet;
  } | null>(null);

  useLayoutEffect(() => {
    if (typeof document === 'undefined') return;
    setTextures({
      lake: createWaterTextures(),
      river: createRiverWaterTextures(),
      ocean: createOceanWaterTextures(),
    });
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (textures) {
      const scroll = (set: TexSet, mx: number, my: number, nx: number, ny: number) => {
        set.map.offset.set(t * mx, t * my);
        set.normalMap.offset.set(t * nx, t * ny);
      };
      scroll(textures.lake, 0.006, 0.004, 0.018, 0.012);
      scroll(textures.river, 0.012, 0.008, 0.028, 0.02);
      scroll(textures.ocean, 0.004, 0.003, 0.01, 0.008);
    }
  });

  const { riverGeom, oceanLineGeom, coastGeom, lakeAreas, oceanAreas } = useMemo(() => {
    const riverGeoms: THREE.BufferGeometry[] = [];
    const oceanLineGeoms: THREE.BufferGeometry[] = [];
    const coastGeoms: THREE.BufferGeometry[] = [];
    const lakes: Array<{
      id: string;
      geometry: THREE.BufferGeometry;
      position: [number, number, number];
    }> = [];
    const oceans: Array<{
      id: string;
      geometry: THREE.BufferGeometry;
      position: [number, number, number];
    }> = [];

    for (const f of features) {
      const cat = catOf(f);

      if (f.kind === 'coastline' && f.geometry.length >= 2) {
        const g = buildCoastlineOceanBand(
          f.geometry,
          centerLat,
          centerLng,
          ySurface,
          OCEAN_BAND_WIDTH_M,
          OCEAN_COAST_U_METERS
        );
        if (g) coastGeoms.push(g);
        continue;
      }

      if (f.kind === 'line' && f.geometry.length >= 2) {
        const pts = f.geometry.map(([lat, lng]) => {
          const [x, z] = latLngToLocal(lat, lng, centerLat, centerLng);
          return new THREE.Vector3(x, ySurface, z);
        });
        const hw = waterLineHalfWidthM(f.type, cat);
        if (cat === 'river') {
          const g = buildWaterRibbon(pts, hw, ySurface, RIVER_U_METERS);
          if (g) riverGeoms.push(g);
        } else {
          const g = buildWaterRibbon(pts, hw, ySurface, OCEAN_LINE_U_METERS);
          if (g) oceanLineGeoms.push(g);
        }
        continue;
      }

      if (f.kind === 'area' && f.geometry.length >= 3) {
        const built = buildWaterArea(f.geometry, centerLat, centerLng, ySurface);
        if (!built) continue;
        if (cat === 'ocean') {
          oceans.push({ id: f.id, ...built });
        } else {
          lakes.push({ id: f.id, ...built });
        }
      }
    }

    return {
      riverGeom: mergeGeoms(riverGeoms),
      oceanLineGeom: mergeGeoms(oceanLineGeoms),
      coastGeom: mergeGeoms(coastGeoms),
      lakeAreas: lakes,
      oceanAreas: oceans,
    };
  }, [features, centerLat, centerLng, ySurface]);

  const oceanMerged = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    if (oceanLineGeom) parts.push(oceanLineGeom);
    if (coastGeom) parts.push(coastGeom);
    return mergeGeoms(parts);
  }, [oceanLineGeom, coastGeom]);

  if (features.length === 0) return null;
  if (!textures) return null;

  const hasAny =
    riverGeom ||
    oceanMerged ||
    lakeAreas.length > 0 ||
    oceanAreas.length > 0;
  if (!hasAny) return null;

  return (
    <group name="water-features">
      {riverGeom && (
        <mesh geometry={riverGeom} receiveShadow>
          <meshPhysicalMaterial
            map={textures.river.map}
            normalMap={textures.river.normalMap}
            normalScale={new THREE.Vector2(0.5, 0.5)}
            {...riverMat}
          />
        </mesh>
      )}
      {oceanMerged && (
        <mesh geometry={oceanMerged} receiveShadow>
          <meshPhysicalMaterial
            map={textures.ocean.map}
            normalMap={textures.ocean.normalMap}
            normalScale={new THREE.Vector2(0.55, 0.55)}
            {...oceanMat}
          />
        </mesh>
      )}
      {lakeAreas.map((item) => (
        <mesh key={item.id} geometry={item.geometry} position={item.position} receiveShadow>
          <meshPhysicalMaterial
            map={textures.lake.map}
            normalMap={textures.lake.normalMap}
            normalScale={new THREE.Vector2(0.45, 0.45)}
            {...lakeMat}
          />
        </mesh>
      ))}
      {oceanAreas.map((item) => (
        <mesh key={item.id} geometry={item.geometry} position={item.position} receiveShadow>
          <meshPhysicalMaterial
            map={textures.ocean.map}
            normalMap={textures.ocean.normalMap}
            normalScale={new THREE.Vector2(0.55, 0.55)}
            {...oceanMat}
          />
        </mesh>
      ))}
    </group>
  );
}
