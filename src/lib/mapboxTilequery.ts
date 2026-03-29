/**
 * Mapbox Tilequery API — features near a point from vector tilesets.
 * Returns Point geometries + metadata, not full polygons (use Overpass for footprints).
 * @see https://docs.mapbox.com/api/maps/tilequery/
 */

const STREETS_TILESET = 'mapbox.mapbox-streets-v8';

export interface TilequeryOptions {
  radiusM?: number;
  limit?: number;
  layers?: string[];
  dedupe?: boolean;
  geometry?: 'polygon' | 'linestring' | 'point';
}

export async function tilequeryNearby(
  lon: number,
  lat: number,
  accessToken: string,
  opts: TilequeryOptions = {},
): Promise<GeoJSON.FeatureCollection> {
  const params = new URLSearchParams({ access_token: accessToken });
  if (opts.radiusM != null) params.set('radius', String(opts.radiusM));
  if (opts.limit != null) params.set('limit', String(Math.min(50, Math.max(1, opts.limit))));
  if (opts.layers?.length) params.set('layers', opts.layers.join(','));
  if (opts.dedupe === false) params.set('dedupe', 'false');
  if (opts.geometry) params.set('geometry', opts.geometry);

  const url = `https://api.mapbox.com/v4/${STREETS_TILESET}/tilequery/${lon},${lat}.json?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Tilequery failed: ${res.status}`);
  return res.json();
}
