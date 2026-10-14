import { DEMO_TEAMS } from "@/lib/data/teams";
import { estimateTravel } from "@/lib/dispatch";
import { triageWithRules } from "@/lib/triage/rules";
import type { CaseAction, OpsState, ResponseUpdate, SosCase, SosInput, Team, TriageResult } from "@/lib/types";

/**
 * In-memory operations store shared by every browser connected to this server.
 * Fine for a single-server prototype; a real deployment needs a database.
 */
interface Store {
  cases: Map<string, SosCase>;
  teams: Map<string, Team>;
  scenarioId: string | null;
}

const NO_VULNERABLE = { children: false, elderly: false, disabled: false };

// Demo cases so the dashboard has a realistic queue from the start.
const DEMO_REPORTS: (SosInput & { minutesAgo: number })[] = [
  {
    minutesAgo: 3,
    hazard: "flood",
    description: "عائلة من خمسة أشخاص محاصرة على سطح المنزل والمياه ترتفع حول البيت",
    peopleCount: 5,
    vulnerable: { children: true, elderly: true, disabled: false },
    shareVulnerable: true,
    position: [24.699, 46.584],
  },
  {
    minutesAgo: 6,
    hazard: "road",
    description: "Car stalled in the flooded underpass, driver is still inside",
    peopleCount: 1,
    vulnerable: NO_VULNERABLE,
    shareVulnerable: false,
    position: [24.627, 46.628],
  },
  {
    minutesAgo: 9,
    hazard: "flood",
    description: "الطريق مغلق بسبب تجمع مياه الأمطار",
    peopleCount: 1,
    vulnerable: NO_VULNERABLE,
    shareVulnerable: false,
    position: [24.713, 46.64],
  },
  {
    minutesAgo: 11,
    hazard: "fire",
    description: "دخان كثيف من مستودع في السلي وعمال يحاولون الخروج، أحدهم مصاب بحروق",
    peopleCount: 4,
    vulnerable: NO_VULNERABLE,
    shareVulnerable: false,
    position: [24.582, 46.806],
  },
  {
    minutesAgo: 14,
    hazard: "road",
    description: "تصادم سيارتين على طريق الملك فهد ويوجد مصابين",
    peopleCount: 3,
    vulnerable: NO_VULNERABLE,
    shareVulnerable: false,
    position: [24.735, 46.656],
  },
  {
    minutesAgo: 18,
    hazard: "flood",
    description: "My elderly mother can't walk and water is entering the ground floor",
    peopleCount: 2,
    vulnerable: { children: false, elderly: true, disabled: true },
    shareVulnerable: true,
    position: [24.655, 46.603],
  },
];

function createStore(): Store {
  const now = Date.now();
  const cases = new Map<string, SosCase>();
  DEMO_REPORTS.forEach(({ minutesAgo, ...input }, i) => {
    const createdAt = now - minutesAgo * 60_000;
    const id = `demo-${i + 1}`;
    cases.set(id, {
      ...input,
      id,
      createdAt,
      updatedAt: createdAt,
      origin: "demo",
      triage: triageWithRules(input),
      status: "new",
    });
  });
  const teams = new Map(DEMO_TEAMS.map((t) => [t.id, { ...t }]));
  const store: Store = { cases, teams, scenarioId: null };

  // One case already in progress, to show the full lifecycle.
  assignTeam(store, "demo-5", "am-2");
  return store;
}

// Kept on globalThis so dev-server hot reloads don't wipe the data.
const g = globalThis as typeof globalThis & { __rpaOpsStore?: Store };
const store = () => (g.__rpaOpsStore ??= createStore());

export class OpsError extends Error {}

function getCase(s: Store, id: string): SosCase {
  const c = s.cases.get(id);
  if (!c) throw new OpsError("Case not found");
  return c;
}

function releaseTeam(s: Store, c: SosCase) {
  const team = c.teamId ? s.teams.get(c.teamId) : undefined;
  if (team && team.caseId === c.id) {
    team.status = "available";
    team.caseId = undefined;
  }
}

function assignTeam(s: Store, caseId: string, teamId: string) {
  const c = getCase(s, caseId);
  const team = s.teams.get(teamId);
  if (!team) throw new OpsError("Team not found");
  if (team.status !== "available") throw new OpsError("Team is not available");
  if (c.status === "resolved") throw new OpsError("Case is already resolved");
  releaseTeam(s, c);
  team.status = "dispatched";
  team.caseId = c.id;
  // Dispatching confirms the assessment if nobody reviewed it yet.
  c.reviewedSeverity ??= c.triage.severity;
  c.status = "assigned";
  c.teamId = team.id;
  c.etaS = estimateTravel(team.base, c.position).etaS;
  c.updatedAt = Date.now();
}

export function getOpsState(): OpsState {
  const s = store();
  return { cases: [...s.cases.values()], teams: [...s.teams.values()], scenarioId: s.scenarioId };
}

/** Adds a resident report. Idempotent, so a retried send doesn't duplicate the case. */
export function addCase(id: string, input: SosInput, triage: TriageResult): SosCase {
  const s = store();
  const existing = s.cases.get(id);
  if (existing) return existing;
  const now = Date.now();
  const c: SosCase = { ...input, id, createdAt: now, updatedAt: now, origin: "resident", triage, status: "new" };
  s.cases.set(id, c);
  return c;
}

export function findCase(id: string): SosCase | undefined {
  return store().cases.get(id);
}

export function applyCaseAction(caseId: string, a: CaseAction) {
  const s = store();
  const c = getCase(s, caseId);
  switch (a.action) {
    case "review":
      c.reviewedSeverity = a.severity;
      if (c.status === "new") c.status = "reviewed";
      break;
    case "assign":
      assignTeam(s, caseId, a.teamId);
      return;
    case "on_scene": {
      const team = c.teamId ? s.teams.get(c.teamId) : undefined;
      if (c.status !== "assigned" || !team) throw new OpsError("No team is on the way");
      c.status = "on_scene";
      team.status = "on_scene";
      break;
    }
    case "resolve":
      releaseTeam(s, c);
      c.status = "resolved";
      break;
  }
  c.updatedAt = Date.now();
}

export function setScenario(id: string | null) {
  store().scenarioId = id;
}

export function resetOps() {
  g.__rpaOpsStore = createStore();
}

/** The resident-facing view of their own reports. */
export function getResponseUpdates(ids: string[]): ResponseUpdate[] {
  const s = store();
  return ids.flatMap((id) => {
    const c = s.cases.get(id);
    if (!c) return [];
    const team = c.teamId ? s.teams.get(c.teamId) : undefined;
    return [
      {
        id: c.id,
        status: c.status,
        severity: c.reviewedSeverity ?? c.triage.severity,
        team: team && c.status !== "resolved" ? { name: team.name, type: team.type } : undefined,
        etaS: c.etaS,
      },
    ];
  });
}
