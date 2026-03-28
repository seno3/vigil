export function latLngToLocal(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number
): [number, number] {
  const x = (lng - centerLng) * 111320 * Math.cos(centerLat * (Math.PI / 180));
  const z = -(lat - centerLat) * 110540; // negate Z so north is "up" in scene
  return [x, z];
}

export function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dlat = (lat2 - lat1) * 110540;
  const dlng = (lng2 - lng1) * 111320 * Math.cos(lat1 * (Math.PI / 180));
  return Math.sqrt(dlat * dlat + dlng * dlng);
}
