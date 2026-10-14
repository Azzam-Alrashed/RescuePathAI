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
export const needsTeam = (c: SosCase) => c.status === "new" || c.status === "reviewed";

/** Highest priority first; ties go to whoever has waited longest. */
export function byPriority(a: SosCase, b: SosCase): number {
  return effectivePriority(b) - effectivePriority(a) || a.createdAt - b.createdAt;
}

export interface TeamOption {
  team: Team;
  distanceM: number;
  etaS: number;
  /** The team isn't the requested type but can respond. */
  substitute: boolean;
}

/** Available teams that can respond to a case, best first. */
export function teamOptions(c: SosCase, teams: Team[], exclude: Set<string> = new Set()): TeamOption[] {
  const wanted = c.triage.team;
  return teams
    .filter((t) => t.status === "available" && !exclude.has(t.id))
    .filter((t) => t.type === wanted || SUBSTITUTES[wanted].includes(t.type))
    .map((t) => ({ team: t, ...estimateTravel(t.base, c.position), substitute: t.type !== wanted }))
    .sort((a, b) => Number(a.substitute) - Number(b.substitute) || a.etaS - b.etaS);
}

/**
 * Suggested assignments for every case still waiting for a team. Cases are
 * served in priority order, so a lower-priority case never takes the team a
 * more urgent one needs. A dispatcher approves each suggestion.
 */
export function planDispatch(cases: SosCase[], teams: Team[]): Map<string, TeamOption> {
  const plan = new Map<string, TeamOption>();
  const reserved = new Set<string>();
  for (const c of cases.filter(needsTeam).sort(byPriority)) {
    const best = teamOptions(c, teams, reserved)[0];
    if (best) {
      plan.set(c.id, best);
      reserved.add(best.team.id);
    }
  }
  return plan;
}
