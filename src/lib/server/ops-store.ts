import { affected, totalAffected } from "@/lib/affected";
import { DEMO_TEAMS } from "@/lib/data/teams";
import { effectivePriority, effectiveSeverity, estimateTravel, isOpen } from "@/lib/dispatch";
import { distanceM } from "@/lib/geo";
import { maxSeverity, triageWithRules } from "@/lib/triage/rules";
import type {
  Bilingual,
  CaseAction,
  CaseOutcome,
  OpsState,
  ResponseUpdate,
  SosCase,
  SosInput,
  Team,
  TriageResult,
} from "@/lib/types";

/**
 * In-memory operations store shared by every browser connected to this server.
 * Fine for a single-server prototype; a real deployment needs a database.
 */
interface Store {
  cases: Map<string, SosCase>;
  teams: Map<string, Team>;
  scenarioIds: string[];
}

type DemoReport = Omit<SosInput, "channel"> & { minutesAgo: number };

// Demo cases so the dashboard has a realistic queue from the start.
const DEMO_REPORTS: DemoReport[] = [
  {
    minutesAgo: 3,
    hazard: "flood",
    description: "عائلة من خمسة أشخاص محاصرة على سطح المنزل والمياه ترتفع حول البيت",
    affected: affected({ adults: 2, children: 2, elderly: 1, trapped: 0 }),
    shareVulnerable: true,
    position: [24.699, 46.584],
  },
  {
    minutesAgo: 6,
    hazard: "flood",
    description: "Car stalled in the flooded underpass, driver is still inside",
    affected: affected({ adults: 1 }),
    shareVulnerable: false,
    position: [24.627, 46.628],
  },
  {
    minutesAgo: 9,
    hazard: "flood",
    description: "الطريق مغلق بسبب تجمع مياه الأمطار",
    affected: affected({ adults: 1 }),
    shareVulnerable: false,
    position: [24.713, 46.64],
  },
  {
    minutesAgo: 11,
    hazard: "fire",
    description: "دخان كثيف من مستودع في السلي وعمال يحاولون الخروج، أحدهم مصاب بحروق",
    affected: affected({ adults: 4 }),
    shareVulnerable: false,
    position: [24.582, 46.806],
  },
  {
    minutesAgo: 14,
    hazard: "collapse",
    description: "انهيار جزئي لسقف مبنى سكني قديم في حي الملز بعد الأمطار، ويوجد مصابين",
    affected: affected({ adults: 3, elderly: 1 }),
    shareVulnerable: true,
    position: [24.665, 46.73],
  },
  {
    minutesAgo: 18,
    hazard: "flood",
    description: "My elderly mother can't walk and water is entering the ground floor",
    affected: affected({ adults: 1, elderly: 1, disabled: 1 }),
    shareVulnerable: true,
    position: [24.655, 46.603],
  },
  {
    // Same incident as the first report, from a neighbour.
    minutesAgo: 2,
    hazard: "flood",
    description: "جيراننا فوق السطح والماء محاوط البيت، فيه أطفال",
    affected: affected({ adults: 2, children: 2 }),
    shareVulnerable: true,
    position: [24.6995, 46.5848],
  },
];

// Earlier cases that are already closed, so the response report has history.
const PAST_REPORTS: (DemoReport & {
  dispatchMin: number;
  travelMin: number;
  sceneMin: number;
  outcome: Exclude<CaseOutcome, "merged">;
  teamIds: string[];
})[] = [
  {
    minutesAgo: 95,
    hazard: "collapse",
    description: "سقوط سور مدرسة بعد الأمطار وإصابة عامل",
    affected: affected({ adults: 1 }),
    shareVulnerable: false,
    position: [24.775, 46.7],
    dispatchMin: 2,
    travelMin: 7,
    sceneMin: 25,
    outcome: "transferred",
    teamIds: ["cd-1", "am-1"],
  },
  {
    minutesAgo: 80,
    hazard: "flood",
    description: "سيارة عالقة في مجرى وادي حنيفة وبداخلها شخصان",
    affected: affected({ adults: 2, trapped: 2 }),
    shareVulnerable: false,
    position: [24.72, 46.58],
    dispatchMin: 1,
    travelMin: 6,
    sceneMin: 30,
    outcome: "rescued",
    teamIds: ["wr-1"],
  },
  {
    minutesAgo: 70,
    hazard: "fire",
    description: "Small kitchen fire in an apartment, everyone is outside",
    affected: affected({ adults: 3, children: 1 }),
    shareVulnerable: true,
    position: [24.69, 46.72],
    dispatchMin: 3,
    travelMin: 8,
    sceneMin: 20,
    outcome: "rescued",
    teamIds: ["fr-1"],
  },
  {
    minutesAgo: 55,
    hazard: "missile",
    description: "صوت انفجار بعيد، لا يوجد ضرر ظاهر",
    affected: affected({ adults: 1 }),
    shareVulnerable: false,
    position: [24.81, 46.64],
    dispatchMin: 4,
    travelMin: 9,
    sceneMin: 12,
    outcome: "false_alarm",
    teamIds: ["cd-2"],
  },
];

/** Reports that arrive when a scenario starts, so simultaneous scenarios fill the queue. */
const SCENARIO_REPORTS: Record<string, DemoReport[]> = {
  "missile-north": [
    {
      minutesAgo: 1,
      hazard: "missile",
      description: "سقطت شظايا على سطح منزل في حي الياسمين وانهار جزء من السور، يوجد مصاب",
      affected: affected({ adults: 3, children: 1 }),
      shareVulnerable: true,
      position: [24.8, 46.645],
    },
    {
      minutesAgo: 0,
      hazard: "trapped",
      description: "Two workers trapped under rubble after the blast near the construction site",
      affected: affected({ adults: 2, trapped: 2 }),
      shareVulnerable: false,
      position: [24.792, 46.668],
    },
  ],
  "flood-hanifah": [
    {
      minutesAgo: 1,
      hazard: "flood",
      description: "المياه دخلت مدرسة بنات في العريجاء وفيه طالبات في الدور الأرضي",
      affected: affected({ adults: 4, children: 25 }),
      shareVulnerable: true,
      position: [24.635, 46.625],
    },
    {
      minutesAgo: 0,
      hazard: "flood",
      description: "Pregnant woman stuck in a car on the valley road, water rising fast",
      affected: affected({ pregnant: 1, trapped: 1 }),
      shareVulnerable: true,
      position: [24.68, 46.598],
    },
  ],
  "fire-sulay": [
    {
      minutesAgo: 1,
      hazard: "fire",
      description: "الحريق امتد لمستودع المواد الكيميائية المجاور ودخان أسود كثيف",
      affected: affected({ adults: 8 }),
      shareVulnerable: false,
      position: [24.586, 46.812],
    },
    {
      minutesAgo: 0,
      hazard: "fire",
      description: "عمال يعانون من ضيق تنفس بسبب الدخان عند بوابة المنطقة الصناعية",
      affected: affected({ adults: 5 }),
      shareVulnerable: false,
      position: [24.578, 46.798],
    },
  ],
};

const REASON_RECEIVED: Bilingual = { ar: "التقييم الأولي عند الاستلام", en: "Initial assessment on arrival" };

function newCase(id: string, input: SosInput, triage: TriageResult, createdAt: number, origin: SosCase["origin"]) {
  const c: SosCase = {
    ...input,
    id,
    createdAt,
    updatedAt: createdAt,
    origin,
    triage,
    status: "new",
    teamIds: [],
    history: [{ at: createdAt, severity: triage.severity, priority: triage.priority, reason: REASON_RECEIVED }],
  };
  return c;
}

function createStore(): Store {
  const now = Date.now();
  const cases = new Map<string, SosCase>();
  const teams = new Map(DEMO_TEAMS.map((t) => [t.id, { ...t }]));
  const store: Store = { cases, teams, scenarioIds: [] };

  PAST_REPORTS.forEach(({ minutesAgo, dispatchMin, travelMin, sceneMin, outcome, teamIds, ...rest }, i) => {
    const input: SosInput = { ...rest, channel: "text" };
    const createdAt = now - minutesAgo * 60_000;
    const c = newCase(`past-${i + 1}`, input, triageWithRules(input), createdAt, "demo");
    c.reviewedSeverity = c.triage.severity;
    c.teamIds = teamIds;
    c.assignedAt = createdAt + dispatchMin * 60_000;
    c.etaS = travelMin * 60;
    c.onSceneAt = c.assignedAt + travelMin * 60_000;
    c.resolvedAt = c.onSceneAt + sceneMin * 60_000;
    c.status = "resolved";
    c.outcome = outcome;
    c.updatedAt = c.resolvedAt;
    cases.set(c.id, c);
  });

  DEMO_REPORTS.forEach((r, i) => addDemoCase(store, `demo-${i + 1}`, r, now));

  // One case already in progress, to show the full lifecycle.
  assignTeam(store, "demo-5", "cd-1");
  assignTeam(store, "demo-5", "am-2");
  return store;
}

function addDemoCase(s: Store, id: string, { minutesAgo, ...rest }: DemoReport, now: number) {
  const input: SosInput = { ...rest, channel: "text" };
  const c = newCase(id, input, triageWithRules(input), now - minutesAgo * 60_000, "demo");
  c.duplicateOf = findDuplicate(s, c)?.id;
  s.cases.set(id, c);
}

// Kept on globalThis so dev-server hot reloads don't wipe the data.
const g = globalThis as typeof globalThis & { __rpaOpsStore2?: Store };
const store = () => (g.__rpaOpsStore2 ??= createStore());

export class OpsError extends Error {}

function getCase(s: Store, id: string): SosCase {
  const c = s.cases.get(id);
  if (!c) throw new OpsError("Case not found");
  return c;
}

const DUPLICATE_RADIUS_M = 300;
const DUPLICATE_WINDOW_MS = 30 * 60_000;

/** An open case that is probably the same incident: same hazard, close by, recent. */
function findDuplicate(s: Store, c: SosCase): SosCase | undefined {
  return [...s.cases.values()].find(
    (o) =>
      o.id !== c.id &&
      isOpen(o) &&
      !o.duplicateOf &&
      o.triage.hazard === c.triage.hazard &&
      Math.abs(o.createdAt - c.createdAt) <= DUPLICATE_WINDOW_MS &&
      distanceM(o.position, c.position) <= DUPLICATE_RADIUS_M,
  );
}

function releaseTeams(s: Store, c: SosCase, only?: string) {
  for (const id of c.teamIds) {
    if (only && id !== only) continue;
    const team = s.teams.get(id);
    if (team && team.caseId === c.id) {
      team.status = "available";
      team.caseId = undefined;
    }
  }
}

function assignTeam(s: Store, caseId: string, teamId: string) {
  const c = getCase(s, caseId);
  const team = s.teams.get(teamId);
  if (!team) throw new OpsError("Team not found");
  if (team.status !== "available") throw new OpsError("Team is not available");
  if (c.status === "resolved") throw new OpsError("Case is already resolved");
  const now = Date.now();
  team.status = c.status === "on_scene" ? "on_scene" : "dispatched";
  team.caseId = c.id;
  // Dispatching confirms the assessment if nobody reviewed it yet.
  c.reviewedSeverity ??= c.triage.severity;
  if (c.status !== "on_scene") c.status = "assigned";
  c.teamIds = [...c.teamIds, team.id];
  c.assignedAt ??= now;
  const eta = estimateTravel(team.base, c.position).etaS;
  c.etaS = c.etaS === undefined ? eta : Math.min(c.etaS, eta);
  c.updatedAt = now;
}

export function getOpsState(): OpsState {
  const s = store();
  return { cases: [...s.cases.values()], teams: [...s.teams.values()], scenarioIds: s.scenarioIds };
}

/** Adds a resident report. Idempotent, so a retried send doesn't duplicate the case. */
export function addCase(id: string, input: SosInput, triage: TriageResult): SosCase {
  const s = store();
  const existing = s.cases.get(id);
  if (existing) return existing;
  const c = newCase(id, input, triage, Date.now(), "resident");
  c.duplicateOf = findDuplicate(s, c)?.id;
  s.cases.set(id, c);
  return c;
}

export function findCase(id: string): SosCase | undefined {
  return store().cases.get(id);
}

const REASON_REVIEW: Bilingual = { ar: "عدّل مسؤول العمليات درجة الخطورة", en: "Dispatcher changed the severity" };
const REASON_MERGE: Bilingual = { ar: "دُمج معه بلاغ مكرر", en: "A duplicate report was merged in" };

function recordHistory(c: SosCase, reason: Bilingual, always = false) {
  const severity = effectiveSeverity(c);
  const priority = effectivePriority(c);
  const last = c.history.at(-1);
  if (!always && last && last.severity === severity && last.priority === priority) return;
  c.history = [...c.history, { at: Date.now(), severity, priority, reason }];
}

/**
 * Re-triages a case after its situation changed (more people, new details).
 * The rating never drops below what it was or what the dispatcher set.
 */
function retriage(c: SosCase, input: SosInput, reason: Bilingual) {
  const triage = triageWithRules(input);
  c.affected = input.affected;
  c.description = input.description;
  c.triage = {
    ...triage,
    severity: maxSeverity(triage.severity, c.triage.severity),
    priority: Math.max(triage.priority, c.triage.priority),
  };
  if (c.reviewedSeverity) c.reviewedSeverity = maxSeverity(c.reviewedSeverity, triage.severity);
  recordHistory(c, reason, true);
}

export function applyCaseAction(caseId: string, a: CaseAction) {
  const s = store();
  const c = getCase(s, caseId);
  const now = Date.now();
  switch (a.action) {
    case "review":
      c.reviewedSeverity = a.severity;
      if (c.status === "new") c.status = "reviewed";
      recordHistory(c, REASON_REVIEW);
      break;
    case "assign":
      assignTeam(s, caseId, a.teamId);
      return;
    case "release": {
      if (!c.teamIds.includes(a.teamId)) throw new OpsError("Team is not on this case");
      releaseTeams(s, c, a.teamId);
      c.teamIds = c.teamIds.filter((id) => id !== a.teamId);
      if (c.teamIds.length === 0 && c.status !== "resolved") {
        c.status = "reviewed";
        c.etaS = undefined;
      }
      break;
    }
    case "on_scene": {
      if (c.status !== "assigned" || c.teamIds.length === 0) throw new OpsError("No team is on the way");
      c.status = "on_scene";
      c.onSceneAt = now;
      for (const id of c.teamIds) {
        const team = s.teams.get(id);
        if (team) team.status = "on_scene";
      }
      break;
    }
    case "resolve":
      releaseTeams(s, c);
      c.status = "resolved";
      c.outcome = a.outcome;
      c.resolvedAt = now;
      break;
    case "reassess": {
      if (c.status === "resolved") throw new OpsError("Case is already resolved");
      const note = a.note.trim();
      const input: SosInput = {
        ...c,
        affected: a.affected,
        description: note ? `${c.description}\n${note}` : c.description,
      };
      retriage(c, input, {
        ar: note ? `إعادة تقييم: ${note}` : `إعادة تقييم: ${totalAffected(a.affected)} متضرر`,
        en: note ? `Reassessed: ${note}` : `Reassessed: ${totalAffected(a.affected)} people affected`,
      });
      break;
    }
    case "merge": {
      const into = getCase(s, a.intoId);
      if (into.id === c.id || !isOpen(into)) throw new OpsError("Cannot merge into that case");
      into.photo ??= c.photo;
      into.photoAnalysis ??= c.photoAnalysis;
      // Both reports counted the same people more or less: keep the larger count per group.
      const merged = Object.fromEntries(
        Object.entries(into.affected).map(([k, v]) => [k, Math.max(v, c.affected[k as keyof typeof c.affected])]),
      ) as typeof into.affected;
      retriage(
        into,
        { ...into, affected: merged, description: `${into.description}\n— ${c.description}` },
        REASON_MERGE,
      );
      into.triage.severity = maxSeverity(into.triage.severity, c.triage.severity);
      into.updatedAt = now;
      releaseTeams(s, c);
      c.status = "resolved";
      c.outcome = "merged";
      c.mergedInto = into.id;
      c.duplicateOf = undefined;
      c.resolvedAt = now;
      break;
    }
    case "not_duplicate":
      c.duplicateOf = undefined;
      break;
  }
  c.updatedAt = now;
}

/** Sets the active scenarios; newly started ones bring their incoming reports. */
export function setScenarios(ids: string[]) {
  const s = store();
  const now = Date.now();
  for (const id of ids) {
    if (s.scenarioIds.includes(id)) continue;
    (SCENARIO_REPORTS[id] ?? []).forEach((r, i) => {
      const caseId = `${id}-${now}-${i}`;
      addDemoCase(s, caseId, r, now);
    });
  }
  s.scenarioIds = ids;
}

export function resetOps() {
  g.__rpaOpsStore2 = createStore();
}

/** The resident-facing view of their own reports. */
export function getResponseUpdates(ids: string[]): ResponseUpdate[] {
  const s = store();
  return ids.flatMap((id) => {
    let c = s.cases.get(id);
    if (!c) return [];
    // A merged report follows the case it was merged into.
    if (c.mergedInto) c = s.cases.get(c.mergedInto) ?? c;
    const teams =
      c.status === "resolved"
        ? []
        : c.teamIds.flatMap((tid) => {
            const team = s.teams.get(tid);
            return team ? [{ name: team.name, type: team.type }] : [];
          });
    return [
      {
        id,
        status: c.status,
        severity: effectiveSeverity(c),
        teams,
        etaS: c.etaS,
      },
    ];
  });
}
