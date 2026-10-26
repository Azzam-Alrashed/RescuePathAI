import { AFFECTED_GROUPS, totalAffected } from "@/lib/affected";
import { SAFE_PLACES } from "@/lib/data/safe-places";
import { SCENARIOS } from "@/lib/data/scenarios";
import { distanceM, isInZone } from "@/lib/geo";
import type { AffectedGroup, Bilingual, LatLng, Severity, SosInput, TriageResult } from "@/lib/types";

const HAZARD: Record<TriageResult["hazard"], Bilingual> = {
  missile: { ar: "تهديد صاروخي", en: "Missile threat" },
  flood: { ar: "سيول", en: "Flood" },
  fire: { ar: "حريق", en: "Fire" },
  road: { ar: "حادث طريق", en: "Road accident" },
  trapped: { ar: "أشخاص محاصرون", en: "People trapped" },
};

const SEVERITY: Record<Severity, Bilingual> = {
  low: { ar: "منخفضة", en: "low" },
  medium: { ar: "متوسطة", en: "medium" },
  high: { ar: "عالية", en: "high" },
  critical: { ar: "حرجة", en: "critical" },
};

const GROUP: Record<AffectedGroup, Bilingual> = {
  adults: { ar: "بالغ", en: "adults" },
  children: { ar: "طفل", en: "children" },
  elderly: { ar: "كبير سن", en: "older adults" },
  disabled: { ar: "من ذوي الإعاقة", en: "with disabilities" },
  pregnant: { ar: "حامل", en: "pregnant" },
  trapped: { ar: "عالق", en: "trapped" },
};

const TEAM: Record<string, Bilingual> = {
  civil_defense: { ar: "دفاع مدني", en: "civil defense" },
  ambulance: { ar: "إسعاف", en: "ambulance" },
  water_rescue: { ar: "إنقاذ مائي", en: "water rescue" },
  fire_rescue: { ar: "إطفاء", en: "fire & rescue" },
  police: { ar: "مرور", en: "traffic police" },
};

/** A readable place name: the scenario zone it falls in, else the nearest landmark. */
export function areaName(position: LatLng): Bilingual {
  const zone = SCENARIOS.find((s) => isInZone(position, s.zone));
  if (zone) {
    // "Flash flood – Wadi Hanifah" → "Wadi Hanifah"
    const part = (text: string) => text.split(" – ").at(-1) ?? text;
    return { ar: part(zone.name.ar), en: part(zone.name.en) };
  }
  const nearest = [...SAFE_PLACES].sort((a, b) => distanceM(position, a.position) - distanceM(position, b.position))[0];
  return { ar: `قرب ${nearest.name.ar}`, en: `near ${nearest.name.en}` };
}

/** One short paragraph per language: what, where, who, how bad and what is needed. */
export function summarizeCase(
  c: SosInput & { triage: TriageResult },
  severity: Severity = c.triage.severity,
): Bilingual {
  const total = Math.max(1, totalAffected(c.affected));
  const groups = AFFECTED_GROUPS.filter((g) => g !== "adults" && c.affected[g] > 0);
  const area = areaName(c.position);
  const teams = c.triage.resources.teams;
  const equipment = c.triage.resources.equipment.slice(0, 3);

  const arGroups = groups.map((g) => `${c.affected[g]} ${GROUP[g].ar}`).join("، ");
  const enGroups = groups.map((g) => `${c.affected[g]} ${GROUP[g].en}`).join(", ");
  const arTeams = teams.map((t) => `${t.count} ${TEAM[t.type].ar}`).join(" + ");
  const enTeams = teams.map((t) => `${t.count} × ${TEAM[t.type].en}`).join(" + ");

  return {
    ar:
      `${HAZARD[c.triage.hazard].ar} في ${area.ar}. ` +
      `عدد المتضررين ${total}${arGroups ? ` (منهم ${arGroups})` : ""}. ` +
      `الخطورة ${SEVERITY[severity].ar}. ` +
      `المطلوب: ${arTeams}${equipment.length ? `، مع ${equipment.map((e) => e.ar).join("، ")}` : ""}.`,
    en:
      `${HAZARD[c.triage.hazard].en} in ${area.en}. ` +
      `${total} ${total === 1 ? "person" : "people"} affected${enGroups ? ` (incl. ${enGroups})` : ""}. ` +
      `Severity ${SEVERITY[severity].en}. ` +
      `Needs: ${enTeams}${equipment.length ? `, with ${equipment.map((e) => e.en.toLowerCase()).join(", ")}` : ""}.`,
  };
}
