import type { Team } from "@/lib/types";

/** Fictional response teams stationed around Riyadh for the prototype. */
export const DEMO_TEAMS: Team[] = [
  { id: "cd-1", type: "civil_defense", name: { ar: "الدفاع المدني ١ – العليا", en: "Civil Defense 1 – Olaya" }, base: [24.69, 46.685], status: "available" },
  { id: "cd-2", type: "civil_defense", name: { ar: "الدفاع المدني ٢ – الشمال", en: "Civil Defense 2 – North" }, base: [24.8, 46.66], status: "available" },
  { id: "wr-1", type: "water_rescue", name: { ar: "الإنقاذ المائي ١ – الدرعية", en: "Water Rescue 1 – Diriyah" }, base: [24.74, 46.575], status: "available" },
  { id: "wr-2", type: "water_rescue", name: { ar: "الإنقاذ المائي ٢ – العريجاء", en: "Water Rescue 2 – Al Uraija" }, base: [24.62, 46.61], status: "available" },
  { id: "fr-1", type: "fire_rescue", name: { ar: "الإطفاء ١ – السلي", en: "Fire & Rescue 1 – Al Sulay" }, base: [24.57, 46.79], status: "available" },
  { id: "fr-2", type: "fire_rescue", name: { ar: "الإطفاء ٢ – الملز", en: "Fire & Rescue 2 – Al Malaz" }, base: [24.665, 46.72], status: "available" },
  { id: "am-1", type: "ambulance", name: { ar: "إسعاف ١ – المربع", en: "Ambulance 1 – Al Murabba" }, base: [24.655, 46.705], status: "available" },
  { id: "am-2", type: "ambulance", name: { ar: "إسعاف ٢ – النخيل", en: "Ambulance 2 – Al Nakheel" }, base: [24.77, 46.64], status: "available" },
  { id: "am-3", type: "ambulance", name: { ar: "إسعاف ٣ – الجنوب", en: "Ambulance 3 – South" }, base: [24.6, 46.73], status: "available" },
  { id: "po-1", type: "police", name: { ar: "دورية المرور ١", en: "Traffic Patrol 1" }, base: [24.72, 46.7], status: "available" },
];
