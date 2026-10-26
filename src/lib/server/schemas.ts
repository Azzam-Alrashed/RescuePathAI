import { z } from "zod";
import { HAZARDS, SEVERITIES, TEAM_TYPES } from "@/lib/triage";

const count = z.number().int().min(0).max(500);

export const AffectedSchema = z.object({
  adults: count,
  children: count,
  elderly: count,
  disabled: count,
  pregnant: count,
  trapped: count,
});

export const ImageAnalysisSchema = z.object({
  hazard: z.enum(HAZARDS),
  severity: z.enum(SEVERITIES),
  teams: z.array(z.enum(TEAM_TYPES)).max(5),
  findings: z.object({ ar: z.string().max(1000), en: z.string().max(1000) }),
  confidence: z.number().min(0).max(1),
  source: z.enum(["ai", "simulated"]),
});
