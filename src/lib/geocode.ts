import { serverForwardGeocodeUrl } from './mapboxGeocoding';

export interface GeocodedLocation {
  lat: number;
  lng: number;
  place_name: string;
}

export interface GeocodeOptions {
  /** Bias toward a point (e.g. map center or selected suggestion) — improves ambiguous queries. */
  proximity?: { lng: number; lat: number };
}

export async function geocodeAddress(
  address: string,
  options?: GeocodeOptions,
): Promise<GeocodedLocation> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token || token === 'pk.your_mapbox_token_here') {
    return { lat: 35.3395, lng: -97.4868, place_name: 'Moore, Oklahoma, United States' };
  }

  const proximity = options?.proximity
    ? ([options.proximity.lng, options.proximity.lat] as [number, number])
    : undefined;

  const url = serverForwardGeocodeUrl({
    accessToken: token,
    query: address,
    proximity,
  });

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Mapbox geocoding failed: ${res.status}`);

  const json = await res.json();
  if (!json.features || json.features.length === 0) {
    throw new Error('Address not found');
  }

  const feature = json.features[0];
  return {
    lat: feature.center[1],
    lng: feature.center[0],
    place_name: feature.place_name,
  };
}
