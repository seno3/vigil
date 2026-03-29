/**
 * Mapbox Geocoding API v5 — shared query params and URL builders.
 * @see https://docs.mapbox.com/api/search/geocoding/
 */

export const GEOCODE_COUNTRY = 'US';
export const GEOCODE_LANGUAGE = 'en';

/** Feature types for forward (search) — broader than place+address alone. */
export const FORWARD_TYPES =
  'place,address,poi,locality,neighborhood,region,district,postcode';

/** Prefer street/place labels when reverse-geocoding a click. */
export const REVERSE_TYPES = 'address,poi,place,locality,neighborhood';

export interface ForwardGeocodeParams {
  accessToken: string;
  /** Search text (URL-encoded separately). */
  query: string;
  /** Bias results toward this point (lng, lat). */
  proximity?: [number, number];
  limit?: number;
}

/**
 * Forward geocoding URL: `/geocoding/v5/mapbox.places/{query}.json?...`
 */
export function forwardGeocodeUrl(p: ForwardGeocodeParams): string {
  const encoded = encodeURIComponent(p.query);
  const params = new URLSearchParams({
    access_token: p.accessToken,
    country: GEOCODE_COUNTRY,
    language: GEOCODE_LANGUAGE,
    types: FORWARD_TYPES,
    limit: String(Math.min(10, Math.max(1, p.limit ?? 8))),
    autocomplete: 'true',
  });
  if (p.proximity) {
    params.set('proximity', `${p.proximity[0]},${p.proximity[1]}`);
  }
  return `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?${params}`;
}

export interface ReverseGeocodeParams {
  accessToken: string;
  lng: number;
  lat: number;
  limit?: number;
}

/**
 * Reverse geocoding URL: `/geocoding/v5/mapbox.places/{lng},{lat}.json?...`
 */
export function reverseGeocodeUrl(p: ReverseGeocodeParams): string {
  const params = new URLSearchParams({
    access_token: p.accessToken,
    language: GEOCODE_LANGUAGE,
    types: REVERSE_TYPES,
    limit: String(Math.min(5, Math.max(1, p.limit ?? 1))),
  });
  return `https://api.mapbox.com/geocoding/v5/mapbox.places/${p.lng},${p.lat}.json?${params}`;
}

export interface ServerForwardGeocodeParams {
  accessToken: string;
  query: string;
  /** Optional lng,lat bias (e.g. from map suggestion or user location). */
  proximity?: [number, number];
}

/** Single-result forward geocode (town model / server). */
export function serverForwardGeocodeUrl(p: ServerForwardGeocodeParams): string {
  const encoded = encodeURIComponent(p.query);
  const params = new URLSearchParams({
    access_token: p.accessToken,
    country: GEOCODE_COUNTRY,
    language: GEOCODE_LANGUAGE,
    types: FORWARD_TYPES,
    limit: '1',
  });
  if (p.proximity) {
    params.set('proximity', `${p.proximity[0]},${p.proximity[1]}`);
  }
  return `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?${params}`;
}
