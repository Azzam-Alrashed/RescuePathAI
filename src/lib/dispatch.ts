import { distanceM } from "@/lib/geo";
import { SEVERITY_BASE } from "@/lib/triage/rules";
import type { LatLng, ResponseTeam, Severity, SosCase, Team } from "@/lib/types";

// Rough urban response estimate: emergency vehicles at ~40 km/h, and streets
// ~30% longer than the straight line.
const RESPONSE_SPEED_MPS = 11;
const ROAD_FACTOR = 1.3;

/** Who can stand in when no team of the requested type is free. */
const SUBSTITUTES: Record<ResponseTeam, ResponseTeam[]> = {
  water_rescue: ["civil_defense"],
  fire_rescue: ["civil_defense"],
  ambulance: ["civil_defense"],
  civil_defense: ["fire_rescue"],
  police: ["civil_defense"],
};

export function estimateTravel(from: LatLng, to: LatLng) {
  const d = distanceM(from, to) * ROAD_FACTOR;
  return { distanceM: d, etaS: d / RESPONSE_SPEED_MPS };
}

export function effectiveSeverity(c: SosCase): Severity {
  return c.reviewedSeverity ?? c.triage.severity;
}

/** AI priority, shifted when a dispatcher corrects the severity. */
export function effectivePriority(c: SosCase): number {
  if (!c.reviewedSeverity) return c.triage.priority;
  const shift = SEVERITY_BASE[c.reviewedSeverity] - SEVERITY_BASE[c.triage.severity];
  return Math.max(1, Math.min(100, c.triage.priority + shift));
}

export const isOpen = (c: SosCase) => c.status !== "resolved";

/** Highest priority first; ties go to whoever has waited longest. */
export function byPriority(a: SosCase, b: SosCase): number {
  return effectivePriority(b) - effectivePriority(a) || a.createdAt - b.createdAt;
}

export interface TeamOption {
  team: Team;
  /** The team type in the case's resource plan this team covers. */
  forType: ResponseTeam;
  distanceM: number;
  etaS: number;
  /** The team isn't the requested type but can respond. */
  substitute: boolean;
}

/**
 * Team types (with counts) the case still needs. An assigned team covers its
 * own type first, then a type it can stand in for.
 */
export function missingTeams(c: SosCase, teams: Team[]): ResponseTeam[] {
  const need = new Map(c.triage.resources.teams.map((t) => [t.type, t.count]));
  const assigned = c.teamIds.map((id) => teams.find((t) => t.id === id)).filter((t): t is Team => !!t);
  for (const team of assigned) {
    const covers =
      (need.get(team.type) ?? 0) > 0
        ? team.type
        : [...need.keys()].find((type) => (need.get(type) ?? 0) > 0 && SUBSTITUTES[type].includes(team.type));
    if (covers) need.set(covers, (need.get(covers) ?? 0) - 1);
  }
  return [...need].flatMap(([type, n]) => Array.from({ length: Math.max(0, n) }, () => type));
}

export const needsTeam = (c: SosCase, teams: Team[]) => isOpen(c) && missingTeams(c, teams).length > 0;

/** Available teams that can cover one team type for a case, best first. */
export function teamOptions(
  c: SosCase,
  teams: Team[],
  wanted: ResponseTeam,
  exclude: Set<string> = new Set(),
): TeamOption[] {
  return teams
    .filter((t) => t.status === "available" && !exclude.has(t.id))
    .filter((t) => t.type === wanted || SUBSTITUTES[wanted].includes(t.type))
    .map((t) => ({ team: t, forType: wanted, ...estimateTravel(t.base, c.position), substitute: t.type !== wanted }))
    .sort((a, b) => Number(a.substitute) - Number(b.substitute) || a.etaS - b.etaS);
}

/** Every available team, nearest first, for a manual pick. */
export function anyTeamOptions(c: SosCase, teams: Team[]): TeamOption[] {
  return teams
    .filter((t) => t.status === "available")
    .map((t) => ({ team: t, forType: t.type, ...estimateTravel(t.base, c.position), substitute: false }))
    .sort((a, b) => a.etaS - b.etaS);
}

/**
 * Suggested assignments for every open case still missing teams. Cases are
 * served in priority order, so a lower-priority case never takes a team a
 * more urgent one needs. A dispatcher approves each suggestion.
 */
export function planDispatch(cases: SosCase[], teams: Team[]): Map<string, TeamOption[]> {
  const plan = new Map<string, TeamOption[]>();
  const reserved = new Set<string>();
  for (const c of cases.filter(isOpen).sort(byPriority)) {
    const picks: TeamOption[] = [];
    for (const type of missingTeams(c, teams)) {
      const best = teamOptions(c, teams, type, reserved)[0];
      if (best) {
        picks.push(best);
        reserved.add(best.team.id);
      }
    }
    if (picks.length > 0) plan.set(c.id, picks);
  }
  return plan;
}
