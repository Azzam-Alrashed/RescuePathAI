import type { HazardType, ResponseTeam, Severity, SosInput, TriageResult } from "@/lib/types";

// Keyword lists cover Arabic and English report text.
const KEYWORDS: Record<HazardType, string[]> = {
  missile: [
    "صاروخ",
    "صواريخ",
    "شظايا",
    "شظية",
    "انفجار",
    "قصف",
    "missile",
    "rocket",
    "debris",
    "explosion",
    "shrapnel",
  ],
  flood: [
    "سيل",
    "سيول",
    "فيضان",
    "غرق",
    "مياه",
    "ماء",
    "مطر",
    "أمطار",
    "وادي",
    "flood",
    "water",
    "rain",
    "drown",
    "wadi",
  ],
  fire: ["حريق", "نار", "دخان", "اشتعال", "لهب", "fire", "smoke", "burning", "flames"],
  road: ["حادث", "تصادم", "سيارة", "مركبة", "انقلاب", "accident", "crash", "collision", "car", "vehicle"],
  trapped: [
    "محاصر",
    "محاصرين",
    "عالق",
    "عالقين",
    "محبوس",
    "تحت الأنقاض",
    "trapped",
    "stuck",
    "rubble",
    "still inside",
    "cannot get out",
    "can't get out",
  ],
};

const LIFE_THREAT = [
  "فاقد الوعي",
  "لا يتنفس",
  "نزيف",
  "ينزف",
  "إصابة خطيرة",
  "يغرق",
  "ترتفع",
  "يرتفع",
  "مختنق",
  "حروق",
  "unconscious",
  "not breathing",
  "bleeding",
  "drowning",
  "rising",
  "severe",
  "choking",
  "burns",
  "dying",
];

const INJURY = ["مصاب", "مصابين", "إصابة", "جرح", "كسر", "injured", "hurt", "wounded", "broken"];

const MINOR = ["مغلق", "إغلاق", "تجمع مياه", "بسيط", "closed", "blocked", "minor", "puddle"];

const includesAny = (text: string, words: string[]) => words.some((w) => text.includes(w));

function detectHazard(text: string, declared: SosInput["hazard"]): HazardType {
  // "Trapped" wins over the underlying hazard: it is what drives the rescue need.
  if (includesAny(text, KEYWORDS.trapped)) return "trapped";
  // The description wins over the resident's quick selection when they disagree.
  for (const type of ["fire", "flood", "missile", "road"] as const) {
    if (includesAny(text, KEYWORDS[type])) return type;
  }
  return declared === "unknown" ? "trapped" : declared;
}

function pickTeam(hazard: HazardType, text: string, injured: boolean, minor: boolean): ResponseTeam {
  if (hazard === "fire" || (hazard === "trapped" && includesAny(text, KEYWORDS.fire))) return "fire_rescue";
  // e.g. a road closed by pooled water: traffic control, not a rescue.
  if (minor) return "police";
  if (hazard === "flood" || (hazard === "trapped" && includesAny(text, KEYWORDS.flood))) return "water_rescue";
  if (hazard === "road") return injured ? "ambulance" : "police";
  if (injured) return "ambulance";
  return "civil_defense";
}

export const SEVERITY_BASE: Record<Severity, number> = { low: 15, medium: 40, high: 65, critical: 85 };

/** Deterministic fallback triage used when the AI service is unavailable. */
export function triageWithRules(input: SosInput): TriageResult {
  const text = input.description.toLowerCase();
  const hazard = detectHazard(text, input.hazard);
  const lifeThreat = includesAny(text, LIFE_THREAT);
  const injured = lifeThreat || includesAny(text, INJURY);
  const minor = includesAny(text, MINOR) && !injured && (hazard === "flood" || hazard === "road");

  let severity: Severity;
  if (hazard === "trapped" || lifeThreat) severity = "critical";
  else if (injured || hazard === "missile" || hazard === "fire") severity = "high";
  else if (minor) severity = "low";
  else severity = "medium";

  const vulnerable = input.shareVulnerable ? Object.values(input.vulnerable).filter(Boolean).length : 0;
  const priority = Math.min(100, SEVERITY_BASE[severity] + Math.min(input.peopleCount - 1, 5) * 2 + vulnerable * 3);

  const reasons: { ar: string[]; en: string[] } = { ar: [], en: [] };
  if (hazard === "trapped") {
    reasons.ar.push("يوجد أشخاص محاصرون");
    reasons.en.push("people are reported trapped");
  }
  if (lifeThreat) {
    reasons.ar.push("مؤشرات على تهديد مباشر للحياة");
    reasons.en.push("signs of an immediate threat to life");
  } else if (injured) {
    reasons.ar.push("توجد إصابات");
    reasons.en.push("injuries are reported");
  }
  if (input.peopleCount > 1) {
    reasons.ar.push(`عدد المتأثرين ${input.peopleCount}`);
    reasons.en.push(`${input.peopleCount} people affected`);
  }
  if (vulnerable > 0) {
    reasons.ar.push("وجود فئات تحتاج دعمًا إضافيًا");
    reasons.en.push("vulnerable people present");
  }
  if (minor) {
    reasons.ar.push("لا مؤشرات على خطر مباشر على الأرواح");
    reasons.en.push("no sign of a direct threat to life");
  }
  if (reasons.ar.length === 0) {
    reasons.ar.push("تقييم أولي بناءً على نوع الخطر");
    reasons.en.push("initial assessment based on hazard type");
  }

  return {
    hazard,
    severity,
    priority,
    team: pickTeam(hazard, text, injured, minor),
    reasoning: {
      ar: reasons.ar.join("، ") + ".",
      en: reasons.en.join(", ").replace(/^./, (c) => c.toUpperCase()) + ".",
    },
    source: "rules",
  };
}
