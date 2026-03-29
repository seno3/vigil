import { TownModel } from '@/types';
import { geocodeAddress } from './geocode';
import { fetchBuildings, fetchRoads, fetchInfrastructure } from './overpass';

const RADIUS_M = 800;

export async function buildTownModel(address: string): Promise<TownModel> {
  const location = await geocodeAddress(address);

  const [buildings, roads, infrastructure] = await Promise.all([
    fetchBuildings(location.lat, location.lng, RADIUS_M),
    fetchRoads(location.lat, location.lng, RADIUS_M),
    fetchInfrastructure(location.lat, location.lng, RADIUS_M),
  ]);

  if (buildings.length < 5) {
    throw new Error(
      `Too few buildings found near "${address}" (got ${buildings.length}). ` +
        'Try a more specific address or a denser area.'
    );
  }

  const lats = buildings.map((b) => b.centroid.lat);
  const lngs = buildings.map((b) => b.centroid.lng);
  const residentialCount = buildings.filter((b) => b.type === 'residential').length;
  const population_estimate = Math.round(residentialCount * 2.5);

  return {
    center: { lat: location.lat, lng: location.lng },
    bounds: {
      north: Math.max(...lats, location.lat + 0.007),
      south: Math.min(...lats, location.lat - 0.007),
      east:  Math.max(...lngs, location.lng + 0.008),
      west:  Math.min(...lngs, location.lng - 0.008),
    },
    buildings,
    roads,
    infrastructure,
    population_estimate,
  };
}
