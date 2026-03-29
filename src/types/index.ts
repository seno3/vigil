export interface Building {
  id: string;
  centroid: { lat: number; lng: number };
  polygon: [number, number][]; // [lat, lng] pairs
  type: string; // residential, commercial, school, hospital
  levels: number;
  material: string; // wood, brick, concrete, steel, unknown
  area_sqm: number;
}

export interface Road {
  id: string;
  name: string;
  geometry: [number, number][]; // [lat, lng] pairs
  type: string; // primary, secondary, residential
}

/** Visual / data category for materials (rivers vs open ocean vs lakes) */
export type WaterCategory = 'river' | 'lake' | 'ocean';

/**
 * OSM-derived water: waterway lines, inland polygons, or coastline (ocean side).
 * Coastline: `kind: 'coastline'` — renderer expands toward sea (land on left of way per OSM).
 */
export interface WaterFeature {
  id: string;
  kind: 'line' | 'area' | 'coastline';
  /** e.g. river, stream, pond, ocean, coastline */
  type: string;
  geometry: [number, number][]; // [lat, lng]
  category: WaterCategory;
}

export interface Infrastructure {
  id: string;
  type: string; // hospital, school, fire_station, shelter
  name: string;
  position: { lat: number; lng: number };
  capacity?: number;
}

export interface TownModel {
  /** Local tangent-plane origin: same as geocode / Overpass `around:` center (not the mean of footprints). */
  center: { lat: number; lng: number };
  bounds: { north: number; south: number; east: number; west: number };
  /** OSM `around:` radius (m). Features that intersect the disk are returned; geometry can extend past this. */
  queryRadiusM: number;
  /** Grass terrain disk radius in the 3D scene (m). Often larger than `queryRadiusM` so partial footprints stay on in-scope ground. */
  groundRadiusM: number;
  buildings: Building[];
  roads: Road[];
  /** Rivers, streams, lakes — from OSM water / waterway */
  waterFeatures: WaterFeature[];
  infrastructure: Infrastructure[];
  population_estimate: number;
}

export type DamageLevel = 'destroyed' | 'major' | 'minor' | 'intact';

export interface PathSegment {
  lat: number;
  lng: number;
  width_m: number;
  wind_speed_mph: number;
}

export interface EvacuationRoute {
  road_ids: string[];
  priority: number;
  geometry?: [number, number][];
}

export interface Deployment {
  type: string;
  location: { lat: number; lng: number };
  reason: string;
}

export interface Label {
  id: string;
  position: { lat: number; lng: number };
  text: string;
  severity: 'critical' | 'warning' | 'info' | 'safe';
}

export interface AgentData {
  affected_buildings?: string[];
  damage_levels?: Record<string, DamageLevel>;
  path_segments?: PathSegment[];
  debris_zones?: Array<{ lat: number; lng: number; radius_m: number }>;
  evacuation_routes?: EvacuationRoute[];
  blocked_roads?: string[];
  estimated_casualties?: number;
  shelter_assignments?: Array<{ shelter_id: string; population: number }>;
  deployments?: Deployment[];
  triage_locations?: Array<{ lat: number; lng: number; priority: number }>;
  labels?: Label[];
  confidence: number;
  reasoning: string;
  summary?: string;
}

export interface AgentOutput {
  agent: 'path' | 'structural' | 'evacuation' | 'response';
  timestamp: number;
  type: 'update' | 'final';
  data: AgentData;
}

export type AgentStatus = 'idle' | 'running' | 'complete' | 'error';

export interface SimulationState {
  status: 'idle' | 'loading' | 'simulating' | 'complete' | 'error';
  townModel: TownModel | null;
  agentStatuses: Record<AgentOutput['agent'], AgentStatus>;
  agentOutputs: Record<AgentOutput['agent'], AgentOutput | null>;
  efScale: number;
  windDirection: string;
  address: string;
  error?: string;
}
