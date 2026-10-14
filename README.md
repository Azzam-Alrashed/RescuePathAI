# RescuePathAI – مسار الإنقاذ الذكي

منصة ذكية لإدارة الكوارث وإنقاذ الأرواح. An AI-powered platform that helps residents stay safe during disasters and missile threats, and helps emergency teams prioritise and respond faster.

> ⚠️ **Prototype.** All alerts, zones, shelters, routes and incidents are simulated demo data for Riyadh. This is not a real emergency service. In a real emergency call **911**.

## What's in this first version

- **Interactive risk map** (Riyadh, OpenStreetMap): affected zones, incidents, closed roads, shelters and assembly points.
- **Scenario simulation**: missile alert (North Riyadh), flash flood (Wadi Hanifah), industrial fire (Al Sulay).
- **Early warning**: residents inside the affected zone get the alert; residents outside are told to avoid the area.
- **Shelter vs. evacuation guidance**: missile alerts route you on foot to the nearest approved shelter; floods and fires route you to the nearest safe assembly point outside the zone.
- **Hazard-specific safety steps**, including simple wording for children and older adults, plus emergency numbers.
- **SOS reports**: location, hazard type, description, number of people, and (with consent) children, older adults or people with disabilities.
- **AI triage**: each report is classified by hazard type, severity (🟢 low → 🔴 critical), priority score and suggested response team, with reasoning in Arabic and English. Assessments are preliminary and flagged for human review.
- **Offline mode**: guidance and numbers are bundled in the app; SOS reports made without a connection are saved, clearly marked "not sent yet", and sent automatically on reconnect.
- **Arabic-first (RTL)** with an English toggle.

## Getting started

```bash
npm install
cp .env.example .env.local   # optional: add ANTHROPIC_API_KEY for AI triage
npm run dev
```

Open http://localhost:3000, then use the **Simulation panel** to start a scenario, press **"Move me into the zone"**, and try sending an SOS. You can also drag the blue marker to change your position.

### AI triage

`POST /api/triage` sends the report to Claude (`claude-opus-5-5`, low effort, structured output) when Anthropic credentials are available. If there are no credentials, or the call fails, the app falls back to a keyword- and rule-based classifier (`src/lib/triage/rules.ts`), so an SOS is never blocked by the AI service. Set `TRIAGE_MODE=rules` to skip the AI entirely.

## Project structure

```
src/
  app/
    page.tsx               # the resident app
    api/triage/route.ts    # SOS triage endpoint (Claude + rules fallback)
  components/              # map, alert panel, SOS form, reports, simulation panel
  lib/
    data/                  # scenarios, shelters/assembly points, safety guidance
    triage/rules.ts        # rule-based triage fallback
    geo.ts, routing.ts     # zone checks, nearest safe place, OSRM routing
    store.tsx, i18n.tsx    # app state and Arabic/English strings
```

Tech: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Leaflet with OpenStreetMap tiles, OSRM routing (routing.openstreetmap.de), and the Anthropic SDK.

## Roadmap

- Responder dashboard: prioritised report queue, human approval of AI assessments, status updates.
- AI rescue dispatch: suggest team assignments from severity, team locations and open roads.
- Family safety check-in: "I'm safe" / "I need help" for family members.
- Predictive flood-risk layer from rainfall, terrain and past incidents. Missile threats rely on official alerts only and are never predicted.
- Installable PWA with a service worker for full offline support.
