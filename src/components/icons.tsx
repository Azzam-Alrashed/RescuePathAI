import {
  Accessibility,
  Ambulance,
  Baby,
  CarFront,
  CircleQuestionMark,
  Flame,
  HardHat,
  LifeBuoy,
  PersonStanding,
  Rocket,
  Shield,
  ShieldCheck,
  Ship,
  FireExtinguisher,
  Flag,
  WavesArrowUp,
  type LucideIcon,
} from "lucide-react";
import type { HazardType, ResponseTeam, VulnerableFlags } from "@/lib/types";

export const HAZARD_ICON: Record<HazardType | "unknown", LucideIcon> = {
  missile: Rocket,
  flood: WavesArrowUp,
  fire: Flame,
  road: CarFront,
  trapped: LifeBuoy,
  unknown: CircleQuestionMark,
};

export const TEAM_ICON: Record<ResponseTeam, LucideIcon> = {
  civil_defense: HardHat,
  ambulance: Ambulance,
  water_rescue: Ship,
  fire_rescue: FireExtinguisher,
  police: Shield,
};

export const PLACE_ICON = { shelter: ShieldCheck, assembly: Flag } as const;

export const VULNERABLE_ICON: Record<keyof VulnerableFlags, LucideIcon> = {
  children: Baby,
  elderly: PersonStanding,
  disabled: Accessibility,
};

/** Tinted background + text colour per hazard, for icon tiles. */
export const HAZARD_TONE: Record<HazardType | "unknown", string> = {
  missile: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  flood: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  fire: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  road: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  trapped: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  unknown: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300",
};

/** A hazard icon in a tinted rounded square. */
export function HazardTile({ hazard, size = "md" }: { hazard: HazardType | "unknown"; size?: "sm" | "md" | "lg" }) {
  const Icon = HAZARD_ICON[hazard];
  const box = { sm: "h-7 w-7 rounded-lg", md: "h-9 w-9 rounded-xl", lg: "h-11 w-11 rounded-xl" }[size];
  const icon = { sm: 15, md: 18, lg: 22 }[size];
  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${box} ${HAZARD_TONE[hazard]}`}>
      <Icon size={icon} strokeWidth={2.2} aria-hidden />
    </span>
  );
}
