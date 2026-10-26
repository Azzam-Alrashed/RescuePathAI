import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { totalAffected } from "@/lib/affected";
import { planResources } from "@/lib/resources";
import { triageWithRules } from "@/lib/triage/rules";
import type { SosInput, TriageResult } from "@/lib/types";

export const HAZARDS = ["missile", "flood", "fire", "collapse", "trapped"] as const;
export const SEVERITIES = ["low", "medium", "high", "critical"] as const;
export const TEAM_TYPES = ["civil_defense", "ambulance", "water_rescue", "fire_rescue", "police"] as const;

const TriageSchema = z.object({
  hazard: z.enum(HAZARDS),
  severity: z.enum(SEVERITIES),
  priority: z.number().int().describe("1 (lowest) to 100 (highest)"),
  team: z.enum(TEAM_TYPES).describe("The main team type the case needs"),
  injured: z.boolean().describe("Whether anyone is or may be injured"),
  reasoning_ar: z.string().describe("One or two short sentences in Arabic"),
  reasoning_en: z.string().describe("The same reasoning in English"),
});

const SYSTEM_PROMPT = `You triage emergency SOS reports for RescuePath AI, a disaster-response platform in Riyadh, Saudi Arabia. Your assessment helps human dispatchers order their queue; a dispatcher always reviews it before acting.

Classify each report:
- hazard: missile (missile threat or debris), flood (flash flood, rising water), fire, collapse (building or structure collapsed or partly collapsed, dangerous cracks, falling walls or roofs), trapped (people who cannot get out on their own; use this whenever someone is trapped, even if the cause is a flood or fire).
- severity:
  - low: limited incident, no sign of a direct threat to life (e.g. a road closed by pooled water).
  - medium: could escalate or cause damage; needs monitoring.
  - high: clear risk to people's safety; needs an urgent response.
  - critical: direct threat to life (e.g. people trapped in a fire or in a building taking on water, someone unconscious or not breathing).
- priority: 1–100. Start from severity (low ≈ 15, medium ≈ 40, high ≈ 65, critical ≈ 85), then raise it for more people affected, for people trapped, and for children, older adults, pregnant women or people with disabilities. A one-tap SOS (no details) is critical until verified. Do not use arrival time.
- team: the main team type needed: civil_defense (general rescue, missile debris, building collapse), ambulance (medical emergencies, injuries), water_rescue (flood rescues, people or vehicles in water), fire_rescue (fires, smoke), police (traffic control and cordons, closed roads without injuries).
- injured: true if anyone is or may be injured (decides whether ambulances go too).
- reasoning: one or two short sentences a dispatcher can scan, in Arabic and in English, naming the facts that drove the rating.

Reports may be in Arabic or English and may be short, panicked or misspelled. When the report is ambiguous, lean towards the higher severity: missing a critical case costs more than over-prioritising. The resident's own hazard choice is a hint, not a fact; the description wins if they disagree.`;

function describeReport(input: SosInput): string {
  const a = input.affected;
  const groups = input.shareVulnerable
    ? `adults ${a.adults}, children ${a.children}, older adults ${a.elderly}, people with disabilities ${a.disabled}, pregnant women ${a.pregnant}, trapped ${a.trapped}`
    : `adults ${a.adults}, trapped ${a.trapped} (vulnerable groups not shared)`;
  const lines = [
    `Report channel: ${input.channel === "sos" ? "one-tap SOS button, no details" : input.channel}`,
    `Hazard selected by the resident: ${input.hazard}`,
    `People affected: ${Math.max(1, totalAffected(a))} (${groups})`,
    `Description:\n<report>\n${input.description || "(no description)"}\n</report>`,
  ];
  if (input.photoAnalysis) {
    const p = input.photoAnalysis;
    lines.push(`Analysis of the attached photo: ${p.hazard}, ${p.severity} severity. ${p.findings.en}`);
  }
  return lines.join("\n");
}

async function triageWithClaude(client: Anthropic, input: SosInput): Promise<TriageResult | null> {
  const response = await client.beta.messages.parse(
    {
      model: "claude-opus-5-5",
      max_tokens: 2048,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: zodOutputFormat(TriageSchema) },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: describeReport(input) }],
    },
    { timeout: 20_000 },
  );

  if (response.stop_reason === "refusal" || !response.parsed_output) return null;
  const out = response.parsed_output;
  const resources = planResources(out.hazard, out.severity, input.affected, out.injured, out.team);
  return {
    hazard: out.hazard,
    severity: out.severity,
    priority: Math.max(1, Math.min(100, out.priority)),
    teams: resources.teams.map((t) => t.type),
    resources,
    reasoning: { ar: out.reasoning_ar, en: out.reasoning_en },
    source: "ai",
  };
}

/**
 * Triage a report with Claude, falling back to the rule-based classifier so an
 * SOS is never blocked by the AI service. Set TRIAGE_MODE=rules to skip the AI.
 */
export async function triageReport(input: SosInput): Promise<TriageResult> {
  if (process.env.TRIAGE_MODE !== "rules") {
    try {
      const result = await triageWithClaude(new Anthropic(), input);
      if (result) return result;
    } catch (err) {
      if (err instanceof Anthropic.APIError) {
        console.error(`Claude triage failed (${err.status ?? "network"}): ${err.message}`);
      } else {
        console.warn(`Claude triage unavailable, using rules: ${err instanceof Error ? err.message : err}`);
      }
    }
  }
  return triageWithRules(input);
}
