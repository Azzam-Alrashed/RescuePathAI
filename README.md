# RescuePathAI – مسار الإنقاذ الذكي

منصة ذكية لإدارة الكوارث وإنقاذ الأرواح. An AI-powered platform that helps residents stay safe during disasters and missile threats, and helps emergency teams prioritise and respond faster.

**Live demo:** [rescuepath-ai.vercel.app](https://rescuepath-ai.vercel.app) (resident app) · [/dashboard](https://rescuepath-ai.vercel.app/dashboard) (operations dashboard)

> ⚠️ **Prototype.** All alerts, zones, shelters, routes and incidents are simulated demo data for Riyadh. This is not a real emergency service. In a real emergency call **911**.

## Features

### Resident app (`/`)

- **Interactive risk map** (Riyadh, OpenStreetMap): affected zones, incidents, closed roads, shelters and assembly points.
- **Scenario simulation**: missile alert (North Riyadh), flash flood (Wadi Hanifah), industrial fire (Al Sulay).
- **Early warning**: residents inside the affected zone get the alert; residents outside are told to avoid the area.
- **Shelter vs. evacuation guidance**: missile alerts route you on foot to the nearest approved shelter, or tell you to shelter in place when none is within a 5-minute walk; floods and fires route you to the nearest safe assembly point outside the zone.
- **Hazard-specific safety steps**, including simple wording for children and older adults, plus emergency numbers.
- **SOS reports**: location, hazard type, description, number of people, and (with consent) children, older adults or people with disabilities.
- **Live response status**: residents see when their report is reviewed, which team is on the way and its ETA, and when it arrives.
- **Offline mode**: guidance and numbers are bundled in the app; SOS reports made without a connection are saved, clearly marked "not sent yet", and sent automatically on reconnect.

### Operations dashboard (`/dashboard`)

- **AI triage**: each report is classified by hazard type, severity (🟢 low → 🔴 critical), priority score and needed team, with reasoning in Arabic and English.
- **Priority queue**: ordered by severity, people affected and vulnerability, not arrival time.
- **Human review**: dispatchers confirm the AI assessment or correct the severity; corrections re-rank the queue.
- **AI dispatch**: suggests the nearest available team of the right type, serving the most urgent cases first so a lower-priority case never takes the team a critical one needs. Falls back to a capable substitute team when none of the right type is free. The dispatcher approves every assignment.
- **Team tracking**: team status (available / dispatched / on scene) on the map, and case status updates through to closure.

Both views are **Arabic-first (RTL)** with an English toggle.

## Getting started

```bash
npm install
cp .env.example .env.local   # optional: add ANTHROPIC_API_KEY for AI triage
npm run dev
```

Open http://localhost:3000, then use the **Simulation panel** to start a scenario, press **"Move me into the zone"**, and try sending an SOS. You can also drag the blue marker to change your position.

Open http://localhost:3000/dashboard in a second window to see the report arrive, review it and dispatch a team, then watch the resident's "My reports" tab update. To send reports from a phone, open the dev server's Network URL on the same Wi-Fi. **Reset demo** on the dashboard restores the sample cases.

> Cases and teams are kept in the server's memory, so they reset when the server restarts, and the prototype assumes a single server instance. A real deployment needs a database and authentication for the dashboard.

### AI triage

`POST /api/reports` sends each new report to Claude (`claude-opus-5-5`, low effort, structured output) when Anthropic credentials are available. If there are no credentials, or the call fails, the app falls back to a keyword- and rule-based classifier (`src/lib/triage/rules.ts`), which also triages the sample cases, so an SOS is never blocked by the AI service. Set `TRIAGE_MODE=rules` to skip the AI entirely.

### Deployment

The live demo is hosted on Vercel, and every push to `main` deploys automatically. Add `ANTHROPIC_API_KEY` under the Vercel project's environment variables to enable Claude triage there; without it the demo uses the rule-based classifier. Because cases live in server memory, the hosted demo can reset after it has been idle.

## Project structure

```
src/
  app/
    page.tsx                   # resident app
    dashboard/page.tsx         # operations dashboard
    api/reports/               # residents: submit SOS (triaged), poll response status
    api/ops/                   # dashboard: live state, case actions, scenario, demo reset
  components/                  # resident UI, dashboard/, map/
  lib/
    data/                      # scenarios, shelters, guidance, response teams
    triage/                    # Claude triage + rule-based fallback
    dispatch.ts                # priority ordering and team suggestions
    server/ops-store.ts        # in-memory case and team store
    geo.ts, routing.ts         # zone checks, nearest safe place, OSRM routing
    store.tsx, i18n.tsx        # resident state and Arabic/English strings
```

Tech: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Lucide icons, Leaflet with OpenStreetMap tiles, OSRM routing (routing.openstreetmap.de), and the Anthropic SDK.

## Roadmap

- Persistent storage (database) and dispatcher sign-in.
- Route-aware dispatch that avoids closed roads.
- Family safety check-in: "I'm safe" / "I need help" for family members.
- Predictive flood-risk layer from rainfall, terrain and past incidents. Missile threats rely on official alerts only and are never predicted.
- Installable PWA with a service worker for full offline support.
