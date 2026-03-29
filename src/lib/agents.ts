import { GoogleGenerativeAI } from '@google/generative-ai';
import { TownModel, AgentOutput, AgentData, PathSegment, DamageLevel } from '@/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

async function callAgent(prompt: string, retries = 1): Promise<AgentData> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3,
    } as Parameters<typeof genAI.getGenerativeModel>[0]['generationConfig'],
  });

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      // Add delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
      return JSON.parse(text) as AgentData;
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`Agent call failed, retrying... (${err})`);
    }
  }
  throw new Error('Agent failed after retries');
}

const EF_WIND_SPEEDS: Record<number, { min: number; max: number; width_m: number }> = {
  1: { min: 86,  max: 110, width_m: 150  },
  2: { min: 111, max: 135, width_m: 300  },
  3: { min: 136, max: 165, width_m: 500  },
  4: { min: 166, max: 200, width_m: 800  },
  5: { min: 201, max: 250, width_m: 1200 },
};

function buildPathPrompt(townModel: TownModel, efScale: number, windDirection: string): string {
  const ef = EF_WIND_SPEEDS[efScale];
  const buildingCount = townModel.buildings.length;

  return `You are a meteorological AI simulating a tornado path for emergency planning purposes.

TASK: Generate a realistic EF${efScale} tornado path through the given area.

EF${efScale} SPECS:
- Wind speed: ${ef.min}–${ef.max} mph
- Typical path width: ${ef.width_m}m
- General movement direction: ${windDirection}

TOWN CENTER: ${townModel.center.lat.toFixed(5)}, ${townModel.center.lng.toFixed(5)}
BOUNDS: N=${townModel.bounds.north.toFixed(5)}, S=${townModel.bounds.south.toFixed(5)}, E=${townModel.bounds.east.toFixed(5)}, W=${townModel.bounds.west.toFixed(5)}
TOTAL BUILDINGS: ${buildingCount}

REASONING RULES:
- Tornadoes in this region typically move SW→NE or W→E
- Path should enter from one edge of the bounds and exit another edge
- Generate 8–12 path points tracing a slightly irregular (not perfectly straight) track
- Width and wind speed vary slightly along path (peak in middle, taper at ends)
- Include 2–4 debris zones: areas of highest damage intensity
- Generate 4–6 informational labels with positions along the path

RETURN EXACTLY this JSON schema (no extra fields):
{
  "path_segments": [
    { "lat": number, "lng": number, "width_m": number, "wind_speed_mph": number }
  ],
  "debris_zones": [
    { "lat": number, "lng": number, "radius_m": number }
  ],
  "labels": [
    {
      "id": "label_path_1",
      "position": { "lat": number, "lng": number },
      "text": string,
      "severity": "critical" | "warning" | "info"
    }
  ],
  "confidence": number,
  "reasoning": string,
  "summary": string
}`;
}

function buildStructuralPrompt(
  townModel: TownModel,
  efScale: number,
  pathData: AgentData
): string {
  const buildingList = townModel.buildings.slice(0, 60).map((b) => ({
    id: b.id,
    lat: b.centroid.lat,
    lng: b.centroid.lng,
    type: b.type,
    material: b.material,
    levels: b.levels,
    area_sqm: b.area_sqm,
  }));

  return `You are a structural engineering AI assessing tornado damage for emergency planning.

TASK: For each building, determine damage level based on proximity to tornado path and building characteristics.

EF SCALE: ${efScale}
TORNADO PATH SEGMENTS: ${JSON.stringify(pathData.path_segments)}
DEBRIS ZONES: ${JSON.stringify(pathData.debris_zones)}

BUILDINGS TO ASSESS (${buildingList.length} buildings):
${JSON.stringify(buildingList)}

DAMAGE REASONING RULES:
- Distance from path centerline vs tornado width determines primary exposure
- Buildings WITHIN path width: high destruction probability
- Buildings within 1.5x path width: major damage likely
- Buildings within 2x path width: minor damage possible
- Beyond 2x path width: intact (unless in debris zone)

MATERIAL RESISTANCE (lowest to highest wind resistance):
- wood: fails at EF1+ winds; common in residential
- brick/masonry: fails at EF2+ winds
- concrete: fails at EF3+ winds
- steel: fails at EF4+ winds

BUILDING TYPE NOTES:
- Hospitals and schools must be assessed with extra care (life-safety critical)
- Multi-story buildings have higher center of mass, more vulnerable to EF3+
- Mobile homes / small residential: treat as wood, worst case

Also identify:
- blocked_roads: list road IDs whose geometry passes through destroyed building zones
- estimated_casualties: estimate based on building count × occupancy × damage severity
- 4–6 labels highlighting critically damaged structures

RETURN EXACTLY this JSON schema:
{
  "damage_levels": { "building_id": "destroyed" | "major" | "minor" | "intact" },
  "affected_buildings": ["building_id"],
  "blocked_roads": ["road_id"],
  "estimated_casualties": number,
  "labels": [
    {
      "id": "label_struct_1",
      "position": { "lat": number, "lng": number },
      "text": string,
      "severity": "critical" | "warning" | "info"
    }
  ],
  "confidence": number,
  "reasoning": string,
  "summary": string
}

TOWN ROADS: ${JSON.stringify(townModel.roads.map((r) => ({ id: r.id, name: r.name, type: r.type })))}`;
}

function buildEvacuationPrompt(
  townModel: TownModel,
  pathData: AgentData,
  structuralData: AgentData
): string {
  return `You are an emergency management AI planning evacuation routes after a tornado strike.

TASK: Identify safe evacuation routes, blocked roads, shelter assignments, and casualty estimates.

TORNADO PATH: ${JSON.stringify(pathData.path_segments?.slice(0, 5))}
BLOCKED ROADS (from structural agent): ${JSON.stringify(structuralData.blocked_roads)}
DAMAGED BUILDINGS: ${Object.keys(structuralData.damage_levels ?? {}).filter(
    (id) => structuralData.damage_levels![id] === 'destroyed' || structuralData.damage_levels![id] === 'major'
  ).length} buildings destroyed or majorly damaged
ESTIMATED CASUALTIES: ${structuralData.estimated_casualties}

ALL ROADS: ${JSON.stringify(townModel.roads.map((r) => ({ id: r.id, name: r.name, type: r.type, geometry: r.geometry.slice(0, 3) })))}
INFRASTRUCTURE: ${JSON.stringify(townModel.infrastructure)}

EVACUATION REASONING:
- Route people away from tornado path (perpendicular to track)
- Prefer primary/secondary roads over residential
- Blocked roads must be avoided in routing
- Assign shelter locations for displaced residents
- Hospitals receive highest priority access

Generate:
- 3–5 evacuation routes (as road_id arrays with geometry for rendering)
- Additional blocked roads beyond structural agent's list
- Shelter assignments for survivors
- Revised casualty estimate including trapped victims
- 4–5 labels for evacuation waypoints and shelters

RETURN EXACTLY this JSON schema:
{
  "evacuation_routes": [
    {
      "road_ids": ["road_id"],
      "priority": number,
      "geometry": [[lat, lng]]
    }
  ],
  "blocked_roads": ["road_id"],
  "shelter_assignments": [
    { "shelter_id": "infra_id", "population": number }
  ],
  "estimated_casualties": number,
  "labels": [
    {
      "id": "label_evac_1",
      "position": { "lat": number, "lng": number },
      "text": string,
      "severity": "critical" | "warning" | "info" | "safe"
    }
  ],
  "confidence": number,
  "reasoning": string,
  "summary": string
}`;
}

function buildResponsePrompt(
  townModel: TownModel,
  efScale: number,
  pathData: AgentData,
  structuralData: AgentData,
  evacuationData: AgentData
): string {
  const destroyedCount = Object.values(structuralData.damage_levels ?? {}).filter(
    (v) => v === 'destroyed'
  ).length;
  const majorCount = Object.values(structuralData.damage_levels ?? {}).filter(
    (v) => v === 'major'
  ).length;

  return `You are an emergency response coordination AI synthesizing all agent data into an actionable deployment plan.

SITUATION SUMMARY:
- EF${efScale} tornado strike on ${townModel.population_estimate} person community
- Buildings destroyed: ${destroyedCount}, major damage: ${majorCount}
- Estimated casualties: ${evacuationData.estimated_casualties}
- Blocked roads: ${evacuationData.blocked_roads?.length ?? 0}
- Evacuation routes active: ${evacuationData.evacuation_routes?.length ?? 0}

INFRASTRUCTURE:
${JSON.stringify(townModel.infrastructure)}

TORNADO PATH MIDPOINT: ${JSON.stringify(pathData.path_segments?.[Math.floor((pathData.path_segments?.length ?? 0) / 2)])}

RESPONSE PLANNING GUIDELINES:
- Stage ambulances near but outside the damage zone (within 500m of heavily damaged areas)
- Establish triage locations at schools/community centers that are undamaged
- Priority search zones: destroyed residential blocks with high estimated occupancy
- Hospital routing: direct ambulances to least-damaged route to hospital
- Fire staging: near collapsed structures for rescue operations
- Command post: at a safe, accessible location central to operations

Generate a complete deployment plan with:
- 4–8 resource deployments (ambulances, fire crews, search teams, command posts)
- 3–4 triage locations with priority levels
- Search priority zones
- 5–6 operational labels

RETURN EXACTLY this JSON schema:
{
  "deployments": [
    {
      "type": "ambulance" | "fire_crew" | "search_team" | "command_post" | "national_guard" | "utility_crew",
      "location": { "lat": number, "lng": number },
      "reason": string
    }
  ],
  "triage_locations": [
    { "lat": number, "lng": number, "priority": number }
  ],
  "labels": [
    {
      "id": "label_resp_1",
      "position": { "lat": number, "lng": number },
      "text": string,
      "severity": "critical" | "warning" | "info" | "safe"
    }
  ],
  "confidence": number,
  "reasoning": string,
  "summary": string
}`;
}

export async function runAgents(
  townModel: TownModel,
  efScale: number,
  windDirection: string,
  onUpdate: (output: AgentOutput) => void
): Promise<void> {
  const now = () => Date.now();

  // Agent 1: Tornado Path
  onUpdate({ agent: 'path', timestamp: now(), type: 'update', data: { confidence: 0, reasoning: 'Analyzing meteorological data...' } });

  const pathData = await callAgent(buildPathPrompt(townModel, efScale, windDirection));
  onUpdate({ agent: 'path', timestamp: now(), type: 'final', data: pathData });

  // Agent 2: Structural
  onUpdate({ agent: 'structural', timestamp: now(), type: 'update', data: { confidence: 0, reasoning: 'Assessing building vulnerabilities...' } });

  const structuralData = await callAgent(buildStructuralPrompt(townModel, efScale, pathData));
  onUpdate({ agent: 'structural', timestamp: now(), type: 'final', data: structuralData });

  // Agent 3: Evacuation
  onUpdate({ agent: 'evacuation', timestamp: now(), type: 'update', data: { confidence: 0, reasoning: 'Computing evacuation routes...' } });

  const evacuationData = await callAgent(buildEvacuationPrompt(townModel, pathData, structuralData));
  onUpdate({ agent: 'evacuation', timestamp: now(), type: 'final', data: evacuationData });

  // Agent 4: Response
  onUpdate({ agent: 'response', timestamp: now(), type: 'update', data: { confidence: 0, reasoning: 'Synthesizing response plan...' } });

  const responseData = await callAgent(buildResponsePrompt(townModel, efScale, pathData, structuralData, evacuationData));
  onUpdate({ agent: 'response', timestamp: now(), type: 'final', data: responseData });
}
