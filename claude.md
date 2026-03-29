# VIGIL — Reference Document

## What It Is
Real-time community threat intelligence. Users submit anonymous safety tips, AI agents verify and escalate, everything visualized on a 3D Mapbox map.

## Kept From Vortex
- Mapbox dark-v11 map with 3D building extrusions
- `lib/townModel.ts`, `lib/overpass.ts`, `lib/geocode.ts`, `lib/geo.ts` — OSM data pipeline
- `api/town-model/route.ts` — geocode + OSM fetch
- Map.tsx — Mapbox initialization, search, 3D layer (modified to add tip interactions)

## Removed From Vortex
- All tornado agents, simulation, SSE streaming, EF scale, wind direction
- SimControls, AgentStatus, CostTicker, Labels3D
- `api/simulate/route.ts`, `lib/agents.ts`

## Tech Stack
Next.js 14, Mapbox GL JS (dark-v11 + fill-extrusion), MongoDB (mongoose), Socket.IO, Redis, Gemini 2.5 Flash, Tailwind CSS, Vultr

## Design System
- Frosted glass everywhere: `bg-white/15 backdrop-blur-xl border border-white/30`
- Text: white at 95/90/50/25% opacity
- Labels: uppercase 10-13px tracking-[0.25em]
- Buttons: frosted pills, never solid. Hover: brighter + scale-[1.02]
- Display font: Playfair Display italic light
- Palette: bg `#0a0a0f`, cards `#141420`, buildings `#1a1a2e`
- Severity: info `#3b82f6`, advisory `#d97706`, warning `#ea580c`, critical `#dc2626`, safe `#22c55e`

## Core Flow
User clicks building → submits tip → MongoDB stores → WebSocket broadcasts → AI agents analyze async → threat level updates → building color changes → feed updates → if 3+ active_threat tips: escalate to critical → red pulsing building + alert banner + evacuation guidance

## AI Agents (Gemini 2.5 Flash, JSON mode)
1. Classifier — threat level, credibility score, urgency decay
2. Corroborator — cross-reference nearby tips, confidence, escalation flag
3. Synthesizer — unified situational summary (only if escalating)
4. Recommender — evacuation direction, shelter, areas to avoid (only if critical)

## Auth
Username + password, bcrypt, JWT httpOnly cookie, MongoDB users collection. Credibility score starts 50 (0-100). Anonymous display.

## Escalation
3+ active_threat tips on same building within 10 min → critical. Building turns red (#dc2626) with pulsing opacity. Alert banner. Recommender guidance.

## Env Vars
NEXT_PUBLIC_MAPBOX_TOKEN, GEMINI_API_KEY, MONGODB_URI, REDIS_URL, JWT_SECRET