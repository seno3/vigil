/** ~meters per degree latitude (WGS84 spherical approximation; matches map APIs for local use). */
const M_PER_DEG_LAT = 111320;

/** Meters per degree longitude at a given latitude (shrinks toward poles). */
export function metersPerDegreeLng(latDeg: number): number {
  return M_PER_DEG_LAT * Math.cos((latDeg * Math.PI) / 180);
}

/**
 * Linear tangent-plane projection at `centerLat` / `centerLng` (same idea as small-area Google Maps / Web Mercator).
 * Returns scene offsets in meters:
 * - x: east positive
 * - z: **south** positive, **north** negative (so +Z in Three.js points south; map “north up” matches OrbitControls from the south)
 *
 * Roads, labels, and paths use this directly as world (x, z).
 */
export function latLngToLocal(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number
): [number, number] {
  const mLng = metersPerDegreeLng(centerLat);
  const x = (lng - centerLng) * mLng;
  const z = -(lat - centerLat) * M_PER_DEG_LAT;
  return [x, z];
}

/** Inverse of {@link latLngToLocal} at the given scene origin. */
export function localToLatLng(
  x: number,
  z: number,
  centerLat: number,
  centerLng: number
): [number, number] {
  const mLng = metersPerDegreeLng(centerLat);
  const lng = centerLng + x / mLng;
  const lat = centerLat - z / M_PER_DEG_LAT;
  return [lat, lng];
}

const CLIP_JOIN_EPS_M = 0.08;

/**
 * Clip one segment (meters, x/z) to a closed disk centered at the origin.
 * Returns a polyline in xz (at least two points when non-empty).
 */
function clipSegmentXZToDisk(
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  R: number
): [number, number][] {
  const R2 = R * R;
  const eps = 1e-2;
  const inside = (x: number, z: number) => x * x + z * z <= R2 + eps;

  const dx = x1 - x0;
  const dz = z1 - z0;
  const a = dx * dx + dz * dz;
  const at = (t: number): [number, number] => [x0 + t * dx, z0 + t * dz];

  if (a < 1e-18) {
    return inside(x0, z0) ? [[x0, z0]] : [];
  }

  const ts = new Set<number>([0, 1]);
  const b = 2 * (x0 * dx + z0 * dz);
  const c = x0 * x0 + z0 * z0 - R2;
  const disc = b * b - 4 * a * c;
  if (disc >= 0) {
    const s = Math.sqrt(disc);
    for (const t of [(-b - s) / (2 * a), (-b + s) / (2 * a)]) {
      if (t >= -1e-9 && t <= 1 + 1e-9) ts.add(Math.max(0, Math.min(1, t)));
    }
  }

  const sorted = Array.from(ts).sort((u, v) => u - v);
  const uniq: number[] = [];
  for (const t of sorted) {
    if (!uniq.length || Math.abs(t - uniq[uniq.length - 1]) > 1e-7) uniq.push(t);
  }

  const out: [number, number][] = [];
  for (let i = 0; i < uniq.length - 1; i++) {
    const ta = uniq[i];
    const tb = uniq[i + 1];
    if (tb - ta < 1e-9) continue;
    const tm = (ta + tb) / 2;
    const [mx, mz] = at(tm);
    if (!inside(mx, mz)) continue;
    const pa = at(ta);
    const pb = at(tb);
    if (out.length === 0) {
      out.push(pa, pb);
    } else {
      const last = out[out.length - 1];
      if (Math.hypot(last[0] - pa[0], last[1] - pa[1]) <= 1e-4) out.push(pb);
      else out.push(pa, pb);
    }
  }
  return out;
}

/**
 * Clip a [lat,lng] polyline to a ground disk (center + radius in meters).
 * Splits into multiple polylines if the way leaves and re-enters the disk.
 */
export function clipPolylineLatLngToDisk(
  geometry: [number, number][],
  centerLat: number,
  centerLng: number,
  radiusM: number
): [number, number][][] {
  if (geometry.length < 2 || radiusM <= 0) return [];

  const runs: [number, number][][] = [];
  let current: [number, number][] = [];

  const flush = () => {
    if (current.length >= 2) runs.push(current);
    current = [];
  };

  for (let i = 0; i < geometry.length - 1; i++) {
    const [lat0, lng0] = geometry[i];
    const [lat1, lng1] = geometry[i + 1];
    const [x0, z0] = latLngToLocal(lat0, lng0, centerLat, centerLng);
    const [x1, z1] = latLngToLocal(lat1, lng1, centerLat, centerLng);
    const seg = clipSegmentXZToDisk(x0, z0, x1, z1, radiusM);
    if (seg.length < 2) continue;

    const latLngSeg = seg.map(([x, z]) => localToLatLng(x, z, centerLat, centerLng));

    if (current.length === 0) {
      current = [...latLngSeg];
      continue;
    }

    const last = current[current.length - 1];
    const first = latLngSeg[0];
    const [lx, lz] = latLngToLocal(last[0], last[1], centerLat, centerLng);
    const [fx, fz] = latLngToLocal(first[0], first[1], centerLat, centerLng);
    if (Math.hypot(lx - fx, lz - fz) < CLIP_JOIN_EPS_M) {
      current.push(...latLngSeg.slice(1));
    } else {
      flush();
      current = [...latLngSeg];
    }
  }
  flush();
  return runs;
}

/**
 * THREE.Shape lives in XY; ExtrudeGeometry + rotateX(-π/2) maps shape Y → **negative** world Z.
 * World footprint offset from centroid is (lx, lz) from {@link latLngToLocal} deltas.
 * Use this when building a Shape so the extruded mesh aligns with (lx, lz) in scene space.
 */
export function worldDeltaToShapeXY(lx: number, lz: number): [number, number] {
  return [lx, -lz];
}

export function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const refLat = (lat1 + lat2) / 2;
  const dlat = (lat2 - lat1) * M_PER_DEG_LAT;
  const dlng = (lng2 - lng1) * metersPerDegreeLng(refLat);
  return Math.sqrt(dlat * dlat + dlng * dlng);
}
