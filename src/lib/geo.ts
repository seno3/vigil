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
