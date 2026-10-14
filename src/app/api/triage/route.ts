import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { triageWithRules } from "@/lib/triage/rules";
import type { SosInput, TriageResult } from "@/lib/types";

const HAZARDS = ["missile", "flood", "fire", "road", "trapped"] as const;

const SosInputSchema = z.object({
  hazard: z.enum([...HAZARDS, "unknown"]),
  description: z.string().max(2000),
  peopleCount: z.number().int().min(1).max(500),
  vulnerable: z.object({ children: z.boolean(), elderly: z.boolean(), disabled: z.boolean() }),
  shareVulnerable: z.boolean(),
  position: z.tuple([z.number(), z.number()]),
});

const TriageSchema = z.object({
  hazard: z.enum(HAZARDS),
  severity: z.enum(["low", "medium", "high", "critical"]),
  priority: z.number().int().describe("1 (lowest) to 100 (highest)"),
  team: z.enum(["civil_defense", "ambulance", "water_rescue", "fire_rescue", "police"]),
  reasoning_ar: z.string().describe("One or two short sentences in Arabic"),
  reasoning_en: z.string().describe("The same reasoning in English"),
});

const SYSTEM_PROMPT = `You triage emergency SOS reports for RescuePath AI, a disaster-response platform in Riyadh, Saudi Arabia. Your assessment helps human dispatchers order their queue; a dispatcher always reviews it before acting.

Classify each report:
- hazard: missile (missile threat or debris), flood (flash flood, rising water), fire, road (traffic accident), trapped (people who cannot get out on their own; use this whenever someone is trapped, even if the cause is a flood or fire).
- severity:
  - low: limited incident, no sign of a direct threat to life (e.g. a road closed by pooled water).
  - medium: could escalate or cause damage; needs monitoring.
  - high: clear risk to people's safety; needs an urgent response.
  - critical: direct threat to life (e.g. people trapped in a fire or in a building taking on water, someone unconscious or not breathing).
- priority: 1–100. Start from severity (low ≈ 15, medium ≈ 40, high ≈ 65, critical ≈ 85), then raise it for more people affected and for children, older adults or people with disabilities. Do not use arrival time.
- team: civil_defense (general rescue, missile debris, structural collapse), ambulance (medical emergencies, injuries), water_rescue (flood rescues, people or vehicles in water), fire_rescue (fires, smoke), police (traffic control, closed roads without injuries).
- reasoning: one or two short sentences a dispatcher can scan, in Arabic and in English, naming the facts that drove the rating.

Reports may be in Arabic or English and may be short, panicked or misspelled. When the report is ambiguous, lean towards the higher severity: missing a critical case costs more than over-prioritising. The resident's own hazard choice is a hint, not a fact; the description wins if they disagree.`;

function describeReport(input: SosInput): string {
  const v = input.vulnerable;
  const vulnerable = input.shareVulnerable
    ? [v.children && "children", v.elderly && "older adults", v.disabled && "people with disabilities"]
        .filter(Boolean)
        .join(", ") || "none reported"
    : "not shared";
  return [
    `Hazard selected by the resident: ${input.hazard}`,
    `People involved: ${input.peopleCount}`,
    `People needing extra support: ${vulnerable}`,
    `Description:\n<report>\n${input.description || "(no description)"}\n</report>`,
  ].join("\n");
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
  return {
    hazard: out.hazard,
    severity: out.severity,
    priority: Math.max(1, Math.min(100, out.priority)),
    team: out.team,
    reasoning: { ar: out.reasoning_ar, en: out.reasoning_en },
    source: "ai",
  };
}

export async function POST(request: Request) {
  const parsed = SosInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid report" }, { status: 400 });
  }
  const input = parsed.data;

  // Set TRIAGE_MODE=rules to skip the AI call entirely (e.g. for offline demos).
  if (process.env.TRIAGE_MODE !== "rules") {
    try {
      const result = await triageWithClaude(new Anthropic(), input);
      if (result) return Response.json(result);
    } catch (err) {
      // Never block an SOS on the AI service: log and fall back to rules.
      if (err instanceof Anthropic.APIError) {
        console.error(`Claude triage failed (${err.status ?? "network"}): ${err.message}`);
      } else {
        console.warn(`Claude triage unavailable, using rules: ${err instanceof Error ? err.message : err}`);
      }
    }
  }

  return Response.json(triageWithRules(input));
}
