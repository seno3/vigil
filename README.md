# Vigil

Real-time community threat intelligence. Users submit anonymous safety tips, a multi-agent AI pipeline verifies and escalates them, and everything is visualized on a 3D Mapbox map.

## What it does

- **Submit flares** — click any building on the map and report a safety incident (active threat, weather, infrastructure, general safety)
- **AI analysis pipeline** — each tip is automatically processed by 4 sequential agents: Classifier → Corroborator → Synthesizer → Recommender
- **Live receipt** — every tip card in the feed shows a real-time AI analysis receipt that fills in as agents complete, streamed over WebSocket
- **Escalation** — when 3+ corroborated tips hit the same area, the building turns red with a pulsing alert and evacuation guidance is generated
- **Community exits** — users can contribute mapped emergency exits for buildings, which the Recommender agent uses when generating evacuation guidance
- **Credibility scoring** — tips carry a credibility score influenced by upvotes and AI classification

## Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Map | Mapbox GL JS — dark-v11 + 3D building extrusions |
| Database | MongoDB (Mongoose) |
| Realtime | Socket.IO on a custom Node HTTP server |
| AI | Gemini 2.0 Flash Lite → FeatherlessAI fallback |
| Auth | JWT httpOnly cookie, bcrypt |
| Styling | Tailwind CSS + inline frosted-glass design system |

## AI agents

The pipeline runs async after each tip is submitted. Agents emit Socket.IO events so the UI updates in real time.

1. **Classifier** — assigns threat level (`info` / `advisory` / `warning` / `critical`), credibility adjustment, urgency decay, and source tags (`firsthand`, `immediate`, etc.)
2. **Corroborator** — cross-references nearby tips from the last 30 minutes, outputs a confidence score and escalation flag
3. **Synthesizer** — only runs on escalation; produces a unified situation report and key facts
4. **Recommender** — only runs on escalation; generates evacuation direction, shelter advice, and areas to avoid using mapped exit data

Primary model: `gemini-2.0-flash-lite`. Falls back to `meta-llama/Meta-Llama-3.1-8B-Instruct` via FeatherlessAI on quota errors.

## Getting started

### Prerequisites

- Node.js 18+
- MongoDB instance
- Mapbox account
- Gemini API key (Google AI Studio) and/or FeatherlessAI API key

### Setup

```bash
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
GEMINI_API_KEY=your_gemini_key
FEATHERLESS_API_KEY=your_featherless_key   # fallback if Gemini quota is hit
MONGODB_URI=mongodb://...
JWT_SECRET=your_jwt_secret
```

```bash
npm run dev
```

The app runs on `http://localhost:3000`. The dev server is a custom Node.js server (`server.js`) that hosts both Next.js and Socket.IO on the same port.

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |

## Project structure

```
src/
├── app/
│   ├── api/
│   │   ├── tips/          # CRUD, upvote, analyze (re-run pipeline)
│   │   ├── exits/         # Community-contributed emergency exits
│   │   ├── threats/       # Active threat buildings
│   │   ├── emergencies/   # Emergency feed
│   │   └── auth/          # Login, signup, session
│   └── dashboard/         # Main map view
├── components/
│   ├── Map.tsx            # Mapbox map, 3D buildings, exit markers
│   ├── NotificationFeed.tsx
│   ├── AnalysisReceipt.tsx
│   ├── TipModal.tsx
│   ├── BuildingPopup.tsx
│   └── ExitModal.tsx
├── lib/
│   ├── agents/            # orchestrator, classifier, corroborator, synthesizer, recommender, llm
│   ├── db/                # MongoDB models: tips, users, exits, emergencies
│   └── socket.ts          # Server-side Socket.IO emit helper
└── hooks/
    ├── useTipAnalysis.ts  # Socket subscription + live agent state
    └── useUserLocation.ts
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Yes | Mapbox public token |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `FEATHERLESS_API_KEY` | No | FeatherlessAI key (Gemini fallback) |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing auth tokens |
