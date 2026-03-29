import { Building, Road, Infrastructure } from '@/types';

interface OverpassNode {
  type: 'node';
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

interface OverpassWay {
  type: 'way';
  id: number;
  nodes?: number[];
  tags?: Record<string, string>;
  geometry?: Array<{ lat: number; lon: number }>;
}

interface OverpassResponse {
  elements: Array<OverpassNode | OverpassWay>;
}

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';
const TIMEOUT = 30000;

async function queryOverpass(query: string): Promise<OverpassResponse> {
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(OVERPASS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(TIMEOUT),
      });

      if (res.status === 429) {
        // Rate limited, wait with exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`Overpass API rate limited, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (!res.ok) throw new Error(`Overpass API error: ${res.status}`);
      return res.json();
    } catch (err) {
      if (attempt === maxRetries - 1) throw err;
      console.warn(`Overpass query failed (attempt ${attempt + 1}), retrying...`, err);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error('Max retries exceeded');
}

function inferBuildingType(tags: Record<string, string> = {}): string {
  const b = tags['building'] ?? '';
  const amenity = tags['amenity'] ?? '';

  if (amenity === 'hospital' || b === 'hospital') return 'hospital';
  if (amenity === 'school' || b === 'school' || b === 'university') return 'school';
  if (amenity === 'fire_station' || b === 'fire_station') return 'fire_station';
  if (b === 'commercial' || b === 'retail' || b === 'office' || b === 'supermarket') return 'commercial';
  if (b === 'industrial' || b === 'warehouse') return 'industrial';
  if (b === 'church' || b === 'cathedral' || amenity === 'place_of_worship') return 'church';
  return 'residential';
}

function inferMaterial(tags: Record<string, string> = {}, type: string): string {
  const mat = tags['building:material'] ?? '';
  if (mat === 'concrete' || mat === 'reinforced_concrete') return 'concrete';
  if (mat === 'steel' || mat === 'metal') return 'steel';
  if (mat === 'brick' || mat === 'stone' || mat === 'masonry') return 'brick';
  if (mat === 'wood' || mat === 'timber') return 'wood';

  if (type === 'hospital' || type === 'industrial') return 'concrete';
  if (type === 'commercial' || type === 'school') return 'brick';
  return 'wood';
}

function polygonArea(polygon: [number, number][]): number {
  // Shoelace formula in approximate meters
  if (polygon.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const [lat1, lng1] = polygon[i];
    const [lat2, lng2] = polygon[(i + 1) % polygon.length];
    const x1 = lng1 * 111320 * Math.cos(lat1 * (Math.PI / 180));
    const y1 = lat1 * 110540;
    const x2 = lng2 * 111320 * Math.cos(lat2 * (Math.PI / 180));
    const y2 = lat2 * 110540;
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2);
}

function computeCentroid(polygon: [number, number][]): { lat: number; lng: number } {
  const lat = polygon.reduce((s, p) => s + p[0], 0) / polygon.length;
  const lng = polygon.reduce((s, p) => s + p[1], 0) / polygon.length;
  return { lat, lng };
}

export async function fetchBuildings(
  lat: number,
  lng: number,
  radius: number
): Promise<Building[]> {
  const query = `
[out:json][timeout:30];
(
  way["building"](around:${radius},${lat},${lng});
);
out body geom;
  `.trim();

  const data = await queryOverpass(query);
  const buildings: Building[] = [];

  for (const el of data.elements) {
    if (el.type !== 'way') continue;
    const way = el as OverpassWay;
    if (!way.geometry || way.geometry.length < 3) continue;

    const polygon: [number, number][] = way.geometry.map((pt) => [pt.lat, pt.lon]);

    // Simplify if too many vertices
    const simplified = polygon.length > 8
      ? simplifyPolygon(polygon)
      : polygon;

    const tags = way.tags ?? {};
    const type = inferBuildingType(tags);
    const material = inferMaterial(tags, type);
    const levels = parseInt(tags['building:levels'] ?? (type === 'commercial' ? '2' : '1'), 10) || 1;
    const area = polygonArea(simplified);
    const centroid = computeCentroid(simplified);

    buildings.push({
      id: `b${way.id}`,
      centroid,
      polygon: simplified,
      type,
      levels,
      material,
      area_sqm: Math.round(area),
    });
  }

  return buildings;
}

function simplifyPolygon(polygon: [number, number][]): [number, number][] {
  const min_lat = Math.min(...polygon.map((p) => p[0]));
  const max_lat = Math.max(...polygon.map((p) => p[0]));
  const min_lng = Math.min(...polygon.map((p) => p[1]));
  const max_lng = Math.max(...polygon.map((p) => p[1]));

  return [
    [min_lat, min_lng],
    [min_lat, max_lng],
    [max_lat, max_lng],
    [max_lat, min_lng],
  ];
}

export async function fetchRoads(
  lat: number,
  lng: number,
  radius: number
): Promise<Road[]> {
  const query = `
[out:json][timeout:30];
(
  way["highway"~"primary|secondary|tertiary|residential|unclassified"](around:${radius},${lat},${lng});
);
out body geom;
  `.trim();

  const data = await queryOverpass(query);
  const roads: Road[] = [];

  for (const el of data.elements) {
    if (el.type !== 'way') continue;
    const way = el as OverpassWay;
    if (!way.geometry || way.geometry.length < 2) continue;

    const tags = way.tags ?? {};
    roads.push({
      id: `r${way.id}`,
      name: tags['name'] ?? tags['ref'] ?? 'Unnamed Road',
      geometry: way.geometry.map((pt) => [pt.lat, pt.lon] as [number, number]),
      type: tags['highway'] ?? 'residential',
    });
  }

  return roads;
}

export async function fetchTownData(
  lat: number,
  lng: number,
  radius: number
): Promise<{ buildings: Building[]; roads: Road[]; infrastructure: Infrastructure[] }> {
  const query = `
[out:json][timeout:30];
(
  way["building"](around:${radius},${lat},${lng});
  node["building"](around:${radius},${lat},${lng});
  way["highway"~"primary|secondary|tertiary|residential|unclassified"](around:${radius},${lat},${lng});
  node["amenity"~"hospital|school|fire_station|shelter|community_centre"](around:${radius},${lat},${lng});
  way["amenity"~"hospital|school|fire_station|shelter|community_centre"](around:${radius},${lat},${lng});
);
out body geom;
  `.trim();

  const data = await queryOverpass(query);
  const buildings: Building[] = [];
  const roads: Road[] = [];
  const infrastructure: Infrastructure[] = [];

  for (const el of data.elements) {
    if (el.type === 'way') {
      const way = el as OverpassWay;
      const tags = way.tags ?? {};

      if (tags['building']) {
        // Building
        if (!way.geometry || way.geometry.length < 3) continue;
        let polygon: [number, number][] = way.geometry.map((pt) => [pt.lat, pt.lon]);

        // Ensure polygon is closed
        if (polygon.length > 2 && (polygon[0][0] !== polygon[polygon.length - 1][0] || polygon[0][1] !== polygon[polygon.length - 1][1])) {
          polygon.push(polygon[0]);
        }

        const type = inferBuildingType(tags);
        const material = inferMaterial(tags, type);
        const levels = parseInt(tags['building:levels'] ?? (type === 'commercial' ? '2' : '1'), 10) || 1;
        const area = polygonArea(polygon);
        const centroid = computeCentroid(polygon);

        buildings.push({
          id: `b${way.id}`,
          centroid,
          polygon,
          type,
          levels,
          material,
          area_sqm: Math.round(area),
        });
      } else if (tags['highway']) {
        // Road
        if (!way.geometry || way.geometry.length < 2) continue;
        roads.push({
          id: `r${way.id}`,
          name: tags['name'] ?? tags['ref'] ?? 'Unnamed Road',
          geometry: way.geometry.map((pt) => [pt.lat, pt.lon] as [number, number]),
          type: tags['highway'] ?? 'residential',
        });
      } else if (tags['amenity']) {
        // Infrastructure (way)
        if (!way.geometry || way.geometry.length === 0) continue;
        const poly: [number, number][] = way.geometry.map((p) => [p.lat, p.lon]);
        const position = computeCentroid(poly);
        infrastructure.push({
          id: `i${el.id}`,
          type: tags['amenity'],
          name: tags['name'] ?? tags['amenity'],
          position,
          capacity: tags['capacity'] ? parseInt(tags['capacity'], 10) : undefined,
        });
      }
    } else if (el.type === 'node') {
      const node = el as OverpassNode;
      const tags = node.tags ?? {};
      if (tags['building']) {
        // Building (node)
        const lat = node.lat;
        const lon = node.lon;
        const size = 0.0001; // approx 10m square
        const polygon: [number, number][] = [
          [lat - size/2, lon - size/2],
          [lat - size/2, lon + size/2],
          [lat + size/2, lon + size/2],
          [lat + size/2, lon - size/2],
          [lat - size/2, lon - size/2], // close
        ];
        const area = polygonArea(polygon);
        const centroid = computeCentroid(polygon);
        const type = inferBuildingType(tags);
        const material = inferMaterial(tags, type);
        const levels = parseInt(tags['building:levels'] ?? '1', 10) || 1;

        buildings.push({
          id: `b${node.id}`,
          centroid,
          polygon,
          type,
          levels,
          material,
          area_sqm: Math.round(area),
        });
      } else if (tags['amenity']) {
        // Infrastructure (node)
        infrastructure.push({
          id: `i${el.id}`,
          type: tags['amenity'],
          name: tags['name'] ?? tags['amenity'],
          position: { lat: node.lat, lng: node.lon },
          capacity: tags['capacity'] ? parseInt(tags['capacity'], 10) : undefined,
        });
      }
    }
  }

  return { buildings, roads, infrastructure };
}
