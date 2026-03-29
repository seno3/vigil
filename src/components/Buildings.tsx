'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { Building, DamageLevel } from '@/types';
import { latLngToLocal, worldDeltaToShapeXY } from '@/lib/geo';
import { FLAT_SURFACE_Y } from '@/lib/sceneHeights';

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function seededRandom(seed: number) {
  let x = seed >>> 0;
  return () => {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    return x / 0xffffffff;
  };
}

function basePalette(building: Building): {
  wall: string;
  trim: string;
  roof: string;
  variant: 'brick' | 'wood' | 'concrete' | 'glass';
} {
  const t = building.type;
  const m = building.material;

  if (t === 'hospital' || t === 'school') {
    return { wall: '#c5d0d8', trim: '#7a8a96', roof: '#4a5568', variant: 'concrete' };
  }
  if (t === 'commercial' || t === 'industrial' || t === 'retail') {
    if (m === 'glass' || m === 'steel') {
      return { wall: '#6b7c8f', trim: '#3d4a5c', roof: '#2d3540', variant: 'glass' };
    }
    return { wall: '#9c7b6a', trim: '#6a5348', roof: '#4a3d38', variant: 'brick' };
  }
  if (m === 'brick' || t === 'church') {
    return { wall: '#a67f6b', trim: '#7a5c4e', roof: '#3d3530', variant: 'brick' };
  }
  if (m === 'concrete' || m === 'steel') {
    return { wall: '#9ca3af', trim: '#6b7280', roof: '#374151', variant: 'concrete' };
  }
  return { wall: '#c4b49a', trim: '#8a7d68', roof: '#5c4f42', variant: 'wood' };
}

function createFacadeTexture(seed: number, variant: 'brick' | 'wood' | 'concrete' | 'glass'): THREE.CanvasTexture {
  const rnd = seededRandom(seed);
  const w = 128;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const base =
    variant === 'brick'
      ? '#a67f6b'
      : variant === 'wood'
        ? '#c4b49a'
        : variant === 'glass'
          ? '#7a8fa3'
          : '#b8c2cc';
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  if (variant === 'brick') {
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += 12) {
      const off = (y / 12) % 2 === 0 ? 0 : 16;
      for (let x = -32; x < w + 32; x += 32) {
        ctx.strokeRect(x + off, y, 30, 11);
      }
    }
  } else if (variant === 'wood') {
    ctx.strokeStyle = 'rgba(60,40,20,0.08)';
    for (let y = 0; y < h; y += 14) {
      ctx.beginPath();
      ctx.moveTo(0, y + rnd() * 4);
      ctx.lineTo(w, y + rnd() * 4);
      ctx.stroke();
    }
  }

  const rows = 8 + Math.floor(rnd() * 4);
  const winH = Math.floor(h / rows) - 4;
  const winW = variant === 'glass' ? 40 : 28;
  ctx.fillStyle = variant === 'glass' ? 'rgba(120,180,220,0.45)' : 'rgba(35,40,55,0.75)';
  for (let row = 1; row < rows; row++) {
    const y = (row * h) / rows + 3;
    const cols = 3 + Math.floor(rnd() * 3);
    for (let c = 0; c < cols; c++) {
      const x = (c + 0.5) * (w / cols) - winW / 2 + (rnd() - 0.5) * 6;
      if (rnd() > 0.08) ctx.fillRect(x, y, winW, winH * 0.65);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, Math.max(1.2, rows / 4));
  tex.anisotropy = 8;
  return tex;
}

function damageWallColor(baseHex: string, damage: DamageLevel | undefined): string {
  if (!damage || damage === 'intact') return baseHex;
  const c = new THREE.Color(baseHex);
  if (damage === 'minor') c.lerp(new THREE.Color('#c9a227'), 0.35);
  else if (damage === 'major') c.lerp(new THREE.Color('#c45c26'), 0.55);
  else c.lerp(new THREE.Color('#7a2e2e'), 0.72);
  return `#${c.getHexString()}`;
}

interface BuildingsProps {
  buildings: Building[];
  damageLevels: Record<string, DamageLevel>;
  centerLat: number;
  centerLng: number;
  /** World Y of ground plane (must clear terrain hills) */
  groundY?: number;
}

interface BuildingMeshProps {
  building: Building;
  damage: DamageLevel | undefined;
  centerLat: number;
  centerLng: number;
  groundY: number;
}

function BuildingMesh({ building, damage, centerLat, centerLng, groundY }: BuildingMeshProps) {
  const seed = hashSeed(building.id);

  const palette = basePalette(building);

  const { footprintGeom, roofGeom, position, rotation } = useMemo(() => {
    const rnd = seededRandom(seed + 41);
    const levels = Math.max(1, building.levels);
    const wallH = levels * 3.4;
    let poly = building.polygon;
    if (poly.length > 2) {
      const a = poly[0];
      const b = poly[poly.length - 1];
      if (a[0] === b[0] && a[1] === b[1]) poly = poly.slice(0, -1);
    }
    const [cx, cz] = latLngToLocal(building.centroid.lat, building.centroid.lng, centerLat, centerLng);

    let rot: [number, number, number] = [0, 0, 0];
    if (damage === 'destroyed') {
      rot = [(rnd() - 0.5) * 0.35, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.28];
    } else if (damage === 'major') {
      rot = [(rnd() - 0.5) * 0.12, 0, (rnd() - 0.5) * 0.1];
    }

    if (poly.length >= 3) {
      try {
        const shape = new THREE.Shape();
        // World offset (lx,lz) must become Shape (x,y) so Extrude + rotateX(-π/2) matches roads/map — see worldDeltaToShapeXY
        const locals = poly.map(([lat, lng]) => {
          const [wx, wz] = latLngToLocal(lat, lng, centerLat, centerLng);
          return worldDeltaToShapeXY(wx - cx, wz - cz);
        });
        shape.moveTo(locals[0][0], locals[0][1]);
        for (let i = 1; i < locals.length; i++) shape.lineTo(locals[i][0], locals[i][1]);
        shape.closePath();

        const wallGeom = new THREE.ExtrudeGeometry(shape, {
          depth: wallH,
          bevelEnabled: true,
          bevelThickness: 0.25,
          bevelSize: 0.2,
          bevelSegments: 1,
        });
        wallGeom.rotateX(-Math.PI / 2);
        wallGeom.computeBoundingBox();
        const minY = wallGeom.boundingBox?.min.y ?? 0;
        wallGeom.translate(0, -minY, 0);

        const box = new THREE.Box2();
        for (const p of locals) box.expandByPoint(new THREE.Vector2(p[0], p[1]));
        const size = new THREE.Vector2();
        const center2 = new THREE.Vector2();
        box.getSize(size);
        box.getCenter(center2);

        let roof: THREE.BufferGeometry;
        const isPeaked =
          building.type === 'residential' || building.type === 'church' || building.type === 'school';
        wallGeom.computeBoundingBox();
        const wallTop = wallGeom.boundingBox!.max.y;

        if (isPeaked && size.x > 8 && size.y > 8) {
          const peak = Math.min(size.x, size.y) * 0.35;
          const roofShape = new THREE.Shape();
          const shrink = 0.92;
          const pts = locals.map(([x, z]) => {
            const lx = center2.x + (x - center2.x) * shrink;
            const lz = center2.y + (z - center2.y) * shrink;
            return [lx, lz] as [number, number];
          });
          roofShape.moveTo(pts[0][0], pts[0][1]);
          for (let i = 1; i < pts.length; i++) roofShape.lineTo(pts[i][0], pts[i][1]);
          roofShape.closePath();
          roof = new THREE.ExtrudeGeometry(roofShape, { depth: Math.max(0.4, peak * 0.12), bevelEnabled: false });
          roof.rotateX(-Math.PI / 2);
          roof.computeBoundingBox();
          roof.translate(0, wallTop - roof.boundingBox!.min.y, 0);
        } else {
          const flatShape = new THREE.Shape();
          const shrink = 0.94;
          const pts = locals.map(([x, z]) => {
            const lx = center2.x + (x - center2.x) * shrink;
            const lz = center2.y + (z - center2.y) * shrink;
            return [lx, lz] as [number, number];
          });
          flatShape.moveTo(pts[0][0], pts[0][1]);
          for (let i = 1; i < pts.length; i++) flatShape.lineTo(pts[i][0], pts[i][1]);
          flatShape.closePath();
          roof = new THREE.ExtrudeGeometry(flatShape, { depth: 0.55, bevelEnabled: false });
          roof.rotateX(-Math.PI / 2);
          roof.computeBoundingBox();
          roof.translate(0, wallTop - roof.boundingBox!.min.y, 0);
        }

        return {
          footprintGeom: wallGeom,
          roofGeom: roof,
          position: [cx, groundY, cz] as [number, number, number],
          rotation: rot,
        };
      } catch {
        // fall through to box
      }
    }

    const side = Math.max(12, Math.sqrt(building.area_sqm));
    const wallGeom = new THREE.BoxGeometry(side, wallH, side);
    wallGeom.translate(0, wallH / 2, 0);
    wallGeom.computeBoundingBox();
    const wallTop = wallGeom.boundingBox!.max.y;
    const roof = new THREE.BoxGeometry(side * 0.96, 0.45, side * 0.96);
    roof.translate(0, wallTop + 0.2, 0);

    return {
      footprintGeom: wallGeom,
      roofGeom: roof,
      position: [cx, groundY, cz] as [number, number, number],
      rotation: rot,
    };
  }, [building, centerLat, centerLng, damage, seed, groundY]);

  const facadeTex = useMemo(() => {
    if (typeof document === 'undefined') return null;
    return createFacadeTexture(seed, palette.variant);
  }, [seed, palette.variant]);

  const wallColor = damageWallColor(palette.wall, damage);
  const roofColor = damageWallColor(palette.roof, damage);

  const edges = useMemo(() => {
    const e = new THREE.EdgesGeometry(footprintGeom, 32);
    return e;
  }, [footprintGeom]);

  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={footprintGeom} castShadow receiveShadow>
        <meshStandardMaterial
          color={wallColor}
          map={facadeTex ?? undefined}
          roughness={palette.variant === 'glass' ? 0.35 : 0.82}
          metalness={palette.variant === 'glass' ? 0.42 : 0.06}
          envMapIntensity={0.45}
        />
      </mesh>
      <mesh geometry={roofGeom} castShadow receiveShadow>
        <meshStandardMaterial
          color={roofColor}
          roughness={0.88}
          metalness={0.08}
        />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#1a1a1a" transparent opacity={0.22} />
      </lineSegments>
    </group>
  );
}

export default function Buildings({
  buildings,
  damageLevels,
  centerLat,
  centerLng,
  groundY = FLAT_SURFACE_Y,
}: BuildingsProps) {
  return (
    <group name="buildings">
      {buildings.map((building) => (
        <BuildingMesh
          key={building.id}
          building={building}
          damage={damageLevels[building.id]}
          centerLat={centerLat}
          centerLng={centerLng}
          groundY={groundY}
        />
      ))}
    </group>
  );
}
