import { TownModel } from '@/types';
import { geocodeAddress } from './geocode';
import { fetchTownData } from './overpass';
import { DEMO_TOWN_MODEL } from './fallback';
import { writeFileSync } from 'fs';

/** OSM Overpass `around:` radius — buildings/roads that intersect this disk are included. */
const RADIUS_M = 2000;

/**
 * 3D grass terrain disk radius (meters), centered on the town.
 * Can be larger than {@link RADIUS_M} so building polygons that straddle the query circle still sit on textured ground.
 */
const GROUND_RADIUS_M = 2300;

export interface BuildTownModelOptions {
  /** Passed to Mapbox forward geocode as `proximity` (lng, lat). */
  proximity?: { lng: number; lat: number };
}

export async function buildTownModel(
  address: string,
  options?: BuildTownModelOptions,
): Promise<TownModel> {
  const location = await geocodeAddress(address, {
    proximity: options?.proximity,
  });

  // Fetch OSM data in one query to reduce API calls
  let buildings, roads, infrastructure, waterFeatures;
  try {
    const data = await fetchTownData(location.lat, location.lng, RADIUS_M);
    buildings = data.buildings;
    roads = data.roads;
    infrastructure = data.infrastructure;
    waterFeatures = data.waterFeatures;

    // Save building locations to CSV for debugging
    if (buildings.length > 0) {
      const csv = 'id,lat,lng\n' + buildings.map(b => `${b.id},${b.centroid.lat},${b.centroid.lng}`).join('\n');
      writeFileSync('buildings.csv', csv);
    }
  } catch (err) {
    console.error('OSM fetch failed, using fallback data:', err);
    return DEMO_TOWN_MODEL;
  }

  // If we got no buildings, use fallback
  if (buildings.length === 0) {
    console.warn('No buildings from OSM, using fallback');
    return DEMO_TOWN_MODEL;
  }

  const lats = buildings.map((b) => b.centroid.lat);
  const lngs = buildings.map((b) => b.centroid.lng);

  /**
   * Scene origin (map, 3D terrain disk, latLngToLocal) must match the Overpass `around:` center
   * (geocoded point). Using the mean building centroid shifts the grass disk off the data/query
   * circle when footprints cluster to one side of the search location.
   */
  const centerLat = location.lat;
  const centerLng = location.lng;

  const residentialCount = buildings.filter((b) => b.type === 'residential').length;
  const population_estimate = Math.round(residentialCount * 2.5);

  const model: TownModel = {
    center: { lat: centerLat, lng: centerLng },
    queryRadiusM: RADIUS_M,
    groundRadiusM: GROUND_RADIUS_M,
    bounds: {
      north: Math.max(...lats, centerLat + 0.007),
      south: Math.min(...lats, centerLat - 0.007),
      east: Math.max(...lngs, centerLng + 0.008),
      west: Math.min(...lngs, centerLng - 0.008),
    },
    buildings,
    roads,
    waterFeatures: waterFeatures ?? [],
    infrastructure,
    population_estimate,
  };

  return model;
}
