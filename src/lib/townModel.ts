import { TownModel } from '@/types';
import { geocodeAddress } from './geocode';
import { fetchTownData } from './overpass';
import { DEMO_TOWN_MODEL } from './fallback';
import { writeFileSync } from 'fs';

const RADIUS_M = 500;

export async function buildTownModel(address: string): Promise<TownModel> {
  // Geocode
  const location = await geocodeAddress(address);

  // Fetch OSM data in one query to reduce API calls
  let buildings, roads, infrastructure;
  try {
    const data = await fetchTownData(location.lat, location.lng, RADIUS_M);
    buildings = data.buildings;
    roads = data.roads;
    infrastructure = data.infrastructure;

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

  // Calculate center as average of building centroids to center the scene on the buildings
  const avgLat = buildings.reduce((s, b) => s + b.centroid.lat, 0) / buildings.length;
  const avgLng = buildings.reduce((s, b) => s + b.centroid.lng, 0) / buildings.length;

  const lats = buildings.map((b) => b.centroid.lat);
  const lngs = buildings.map((b) => b.centroid.lng);

  const residentialCount = buildings.filter((b) => b.type === 'residential').length;
  const population_estimate = Math.round(residentialCount * 2.5);

  const model: TownModel = {
    center: { lat: avgLat, lng: avgLng },
    bounds: {
      north: Math.max(...lats, avgLat + 0.007),
      south: Math.min(...lats, avgLat - 0.007),
      east: Math.max(...lngs, avgLng + 0.008),
      west: Math.min(...lngs, avgLng - 0.008),
    },
    buildings,
    roads,
    infrastructure,
    population_estimate,
  };

  return model;
}
