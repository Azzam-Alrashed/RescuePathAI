import { totalAffected, vulnerableCount } from "@/lib/affected";
import type { AffectedCounts, Bilingual, HazardType, ResourcePlan, ResponseTeam, Severity } from "@/lib/types";

const EQUIPMENT = {
  boat: { ar: "قارب إنقاذ", en: "Rescue boat" },
  lifeJackets: { ar: "سترات نجاة", en: "Life jackets" },
  ropes: { ar: "حبال إنقاذ", en: "Rescue ropes" },
  pumps: { ar: "مضخات سحب مياه", en: "Water pumps" },
  engine: { ar: "سيارة إطفاء", en: "Fire engine" },
  breathing: { ar: "أجهزة تنفس", en: "Breathing apparatus" },
  ladder: { ar: "سلّم هيدروليكي", en: "Aerial ladder" },
  cutters: { ar: "مقصات هيدروليكية", en: "Hydraulic cutters" },
  search: { ar: "معدات بحث تحت الأنقاض", en: "Rubble search kit" },
  detector: { ar: "كاشف شظايا ومتفجرات", en: "Debris / ordnance detector" },
  stretchers: { ar: "نقالات", en: "Stretchers" },
  firstAid: { ar: "حقيبة إسعافات أولية", en: "First-aid kit" },
  wheelchair: { ar: "كرسي متحرك / نقالة خاصة", en: "Wheelchair / special stretcher" },
  barriers: { ar: "حواجز ومخاريط مرور", en: "Traffic barriers & cones" },
  tow: { ar: "ونش سحب", en: "Tow truck" },
} satisfies Record<string, Bilingual>;

/** Main team type per hazard, before looking at injuries. */
const PRIMARY: Record<HazardType, ResponseTeam> = {
  flood: "water_rescue",
  fire: "fire_rescue",
  missile: "civil_defense",
  road: "police",
  trapped: "civil_defense",
};

const HAZARD_EQUIPMENT: Record<HazardType, Bilingual[]> = {
  flood: [EQUIPMENT.boat, EQUIPMENT.lifeJackets, EQUIPMENT.ropes],
  fire: [EQUIPMENT.engine, EQUIPMENT.breathing, EQUIPMENT.ladder],
  missile: [EQUIPMENT.detector, EQUIPMENT.search, EQUIPMENT.cutters],
  road: [EQUIPMENT.barriers, EQUIPMENT.cutters, EQUIPMENT.tow],
  trapped: [EQUIPMENT.cutters, EQUIPMENT.search, EQUIPMENT.ropes],
};

const TEAM_HAZARD: Partial<Record<ResponseTeam, HazardType>> = { water_rescue: "flood", fire_rescue: "fire" };

/** Rough capacity of one team, used to scale the number of teams with the people affected. */
const PEOPLE_PER_TEAM = 6;

/**
 * Teams (type × count) and equipment a case needs. Deterministic, so the plan
 * is the same whether the AI or the rules did the triage.
 */
export function planResources(
  hazard: HazardType,
  severity: Severity,
  affectedCounts: AffectedCounts,
  injured: boolean,
  primary: ResponseTeam = PRIMARY[hazard],
): ResourcePlan {
  const people = totalAffected(affectedCounts);
  const urgent = severity === "high" || severity === "critical";
  const counts = new Map<ResponseTeam, number>();
  const add = (type: ResponseTeam, n: number) => counts.set(type, Math.max(counts.get(type) ?? 0, n));

  add(primary, Math.min(3, Math.max(1, Math.ceil(people / PEOPLE_PER_TEAM))));
  // Medical cover for injuries, urgent cases and vulnerable people.
  if (injured || urgent || vulnerableCount(affectedCounts) > 0) {
    add("ambulance", Math.min(3, Math.max(1, Math.ceil(people / 8))));
  }
  // Trapped people need civil defense alongside the hazard team.
  if (affectedCounts.trapped > 0 && primary !== "civil_defense") add("civil_defense", 1);
  // Large incidents need traffic control around the scene.
  if (people >= 10 || (hazard === "missile" && urgent)) add("police", 1);

  // People trapped by water or fire need that hazard's kit as well as cutters.
  const underlying = hazard === "trapped" ? TEAM_HAZARD[primary] : undefined;
  const equipment = underlying ? [...HAZARD_EQUIPMENT[underlying], EQUIPMENT.cutters] : [...HAZARD_EQUIPMENT[hazard]];
  if (primary === "police" && hazard !== "road") equipment.unshift(EQUIPMENT.barriers);
  if (hazard === "flood" && severity === "low")
    equipment.splice(0, equipment.length, EQUIPMENT.pumps, EQUIPMENT.barriers);
  if (counts.has("ambulance")) equipment.push(EQUIPMENT.stretchers, EQUIPMENT.firstAid);
  if (affectedCounts.elderly + affectedCounts.disabled > 0) equipment.push(EQUIPMENT.wheelchair);

  return {
    teams: [...counts].map(([type, count]) => ({ type, count })),
    equipment,
  };
}

export function teamTypes(plan: ResourcePlan): ResponseTeam[] {
  return plan.teams.map((t) => t.type);
}
