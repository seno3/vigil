# VORTEX — Claude Reference Document

## What This Is
Vortex is an AI tornado impact simulator. User types an address, picks an EF scale, and watches a multi-agent AI system simulate tornado damage across real building footprints — rendered as an interactive 3D scene with real-time agent streaming.

## Why It Exists
- US averages ~1,200 tornadoes/year, ~$5B+ annual damage
- Emergency managers have no tool to simulate "what if an EF4 hits THIS town"
- Built for the "Best Use of Vultr" hackathon prize — Vultr infrastructure is structurally necessary, not bolted on

## Architecture Overview

```
[Mapbox + Address Input] → [Data Pipeline] → [Town Model JSON]
                                                    ↓
                                            [Agent Orchestrator]
                                            ┌───────┴────────┐
                                    [Agent 1: Path]  [Agent 2: Structural]
                                    [Agent 3: Evac]  [Agent 4: Response]
                                            └───────┬────────┘
                                          [Redis State Sharing]
                                                    ↓
                                    [WebSocket Stream to Frontend]
                                    ┌───────────┴───────────┐
                            [3D Scene (R3F)]     [Dashboard Panels]
```

## Tech Stack
- **Frontend**: Next.js 14 (App Router), React Three Fiber, Drei, Mapbox GL JS, Tailwind CSS
- **Real-time**: WebSockets (Socket.IO)
- **Backend**: Next.js API routes + standalone WebSocket server
- **AI Agents**: Vultr Serverless Inference (OpenAI-compatible API) or fallback to any OpenAI-compatible endpoint
- **State**: Redis for inter-agent communication
- **Data Sources**: OpenStreetMap Overpass API (buildings), Mapbox (terrain/geocoding)

## Data Pipeline Detail

### Address → Town Model
1. Geocode address via Mapbox Geocoding API
2. Query OSM Overpass for building footprints in ~500m radius:
   ```
   [out:json];
   way["building"](around:500,{lat},{lng});
   out body geom;
   ```
3. Extract: building polygons, tags (material, levels, type), centroid coords
4. Query critical infrastructure: hospitals, schools, fire stations, shelters
5. Get road network for evacuation routing
6. Package into TownModel JSON schema (below)

### TownModel Schema
```typescript
interface TownModel {
  center: { lat: number; lng: number };
  bounds: { north: number; south: number; east: number; west: number };
  buildings: Array<{
    id: string;
    centroid: { lat: number; lng: number };
    polygon: [number, number][]; // lat/lng pairs
    type: string; // residential, commercial, school, hospital
    levels: number;
    material: string; // wood, brick, concrete, steel, unknown
    area_sqm: number;
  }>;
  roads: Array<{
    id: string;
    name: string;
    geometry: [number, number][];
    type: string; // primary, secondary, residential
  }>;
  infrastructure: Array<{
    id: string;
    type: string; // hospital, school, fire_station, shelter
    name: string;
    position: { lat: number; lng: number };
    capacity?: number;
  }>;
  population_estimate: number;
}
```

## Agent System Detail

All agents receive the TownModel + simulation params (EF scale, direction, time of day).
Agents communicate via Redis pub/sub — each publishes findings, subscribes to others.

### Agent 1: Tornado Path & Physics
- Input: TownModel center, EF scale (1-5), wind direction
- Output: Array of path segments with wind speeds, width, debris generation rate
- Publishes to Redis: `tornado:path` channel
- Key reasoning: EF scale → wind speed range → path width → debris field radius

### Agent 2: Structural Impact
- Input: TownModel buildings + subscribes to `tornado:path`
- Output: Per-building damage assessment (destroyed/major/minor/intact) with confidence
- Publishes to Redis: `structural:damage` channel
- Key reasoning: building material + levels + distance from path center + wind speed = damage probability
- Wood frame < brick < concrete < steel in wind resistance

### Agent 3: Evacuation & Human Safety
- Input: TownModel roads + infrastructure, subscribes to `tornado:path` and `structural:damage`
- Output: Evacuation routes, blocked roads, trapped population estimates, shelter assignments
- Publishes to Redis: `evacuation:routes` channel
- Key reasoning: debris blocks roads → reroute → population density × damage = casualty estimate

### Agent 4: Emergency Response
- Input: Subscribes to ALL other channels
- Output: Resource deployment plan — where to stage ambulances, triage locations, hospital routing
- Publishes to Redis: `response:plan` channel
- This is the synthesis agent — it waits for others and produces the final actionable plan

### Agent Output Schema (streamed via WebSocket)
```typescript
interface AgentOutput {
  agent: 'path' | 'structural' | 'evacuation' | 'response';
  timestamp: number;
  type: 'update' | 'final';
  data: {
    affected_buildings?: string[];
    damage_levels?: Record<string, 'destroyed' | 'major' | 'minor' | 'intact'>;
    path_segments?: Array<{ lat: number; lng: number; width: number; wind_speed: number }>;
    evacuation_routes?: Array<{ road_ids: string[]; priority: number }>;
    blocked_roads?: string[];
    deployments?: Array<{ type: string; location: { lat: number; lng: number }; reason: string }>;
    confidence: number;
    reasoning: string;
  };
}
```

## 3D Scene Specification

### Coordinate System
- Convert lat/lng to local meters using center point as origin
- 1 unit = 1 meter in the scene
- Y-axis = up (height)

### Building Rendering
- Extrude building polygons to height (levels × 3.5m)
- Color by damage state:
  - Intact: `#4a5568` (gray)
  - Minor: `#ecc94b` (yellow)
  - Major: `#ed8936` (orange)
  - Destroyed: `#e53e3e` (red)
- Transition colors smoothly as agent updates stream in

### Tornado Visualization
- Animated funnel at current path position
- Path trail on ground (semi-transparent red gradient)
- Particle system for debris field (spread by wind direction)

### Evacuation Routes
- Glowing green lines on road network for active routes
- Red X markers on blocked roads
- Pulsing circles at shelter locations

### Camera
- Default: 45° bird's eye view of the area
- OrbitControls for judge interaction
- Smooth camera animation on simulation start

## Dashboard Panels (alongside 3D scene)
1. **Simulation Controls**: Address input, EF scale selector (1-5), direction picker, "Simulate" button
2. **Agent Status**: Live indicators showing which agents are running/complete
3. **Impact Summary**: Buildings destroyed/damaged, estimated casualties, roads blocked
4. **Response Plan**: Where to deploy resources (from Agent 4)
5. **Cost Ticker**: Live display of Vultr compute cost for this simulation

## Vultr Integration Points
- Serverless Inference endpoint for all 4 agents (OpenAI-compatible API)
- Environment variable: `VULTR_INFERENCE_URL` and `VULTR_API_KEY`
- For MVP/demo: can use any OpenAI-compatible endpoint as fallback
- In production narrative: agents run on Vultr Cloud GPU, app on Vultr Kubernetes Engine, cached results on Vultr Object Storage

## File Structure
```
vortex/
├── package.json
├── next.config.js
├── .env.local
├── claude.md
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   └── api/
│   │       ├── simulate/
│   │       │   └── route.ts
│   │       ├── geocode/
│   │       │   └── route.ts
│   │       └── buildings/
│   │           └── route.ts
│   ├── components/
│   │   ├── Map.tsx
│   │   ├── Scene3D.tsx
│   │   ├── Buildings.tsx
│   │   ├── TornadoPath.tsx
│   │   ├── EvacRoutes.tsx
│   │   ├── Dashboard.tsx
│   │   ├── AgentStatus.tsx
│   │   └── SimControls.tsx
│   ├── lib/
│   │   ├── agents/
│   │   │   ├── orchestrator.ts
│   │   │   ├── pathAgent.ts
│   │   │   ├── structuralAgent.ts
│   │   │   ├── evacuationAgent.ts
│   │   │   └── responseAgent.ts
│   │   ├── data/
│   │   │   ├── osm.ts
│   │   │   ├── geocode.ts
│   │   │   └── townModel.ts
│   │   ├── geo.ts
│   │   ├── redis.ts
│   │   └── socket.ts
│   └── types/
│       └── index.ts
└── server/
    └── ws.ts
```

## Design Direction
- **Aesthetic**: Dark, tactical, utilitarian — military command center / NOAA radar
- **Primary bg**: Near-black (`#0a0a0f`)
- **Accent**: Warning orange (`#ff6b2b`) and alert red (`#ef4444`)
- **Secondary accent**: Cool cyan (`#22d3ee`) for safe zones and data
- **Typography**: Monospace for data (JetBrains Mono), sans-serif for UI (Geist)
- **Feel**: Emergency operations center — life-or-death decisions

## Key Constraints
1. No hardware/IoT — pure software
2. Must work with mock data if APIs unavailable (include realistic mock TownModel)
3. WebSocket streaming is critical — agents must feel "alive"
4. 3D scene is the hero — first thing judges see
5. Desktop only — no mobile needed
6. Include a hardcoded demo address that always works perfectly