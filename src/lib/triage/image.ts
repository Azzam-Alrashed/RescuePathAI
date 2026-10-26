import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { NO_AFFECTED } from "@/lib/affected";
import { planResources } from "@/lib/resources";
import { HAZARDS, SEVERITIES, TEAM_TYPES } from "@/lib/triage";
import type { Bilingual, HazardType, ImageAnalysis, Severity } from "@/lib/types";

const ImageSchema = z.object({
  is_incident: z.boolean().describe("false if the photo shows no emergency at all"),
  hazard: z.enum(HAZARDS),
  severity: z.enum(SEVERITIES),
  teams: z.array(z.enum(TEAM_TYPES)).describe("Team types needed, most important first (1–3)"),
  findings_ar: z.string().describe("Two or three short sentences in Arabic: what the photo shows that matters"),
  findings_en: z.string().describe("The same findings in English"),
  confidence: z.number().describe("0 to 1"),
});

const SYSTEM_PROMPT = `You look at photos residents attach to emergency reports for RescuePath AI, a disaster-response platform in Riyadh, Saudi Arabia. Your preliminary reading helps dispatchers; a human always reviews it.

From the photo, decide:
- hazard: missile (missile strike, debris, shrapnel, blast damage), flood (flash flood, standing or rising water, submerged cars), fire (flames, smoke), collapse (collapsed or partly collapsed building, wall or roof; large structural cracks), trapped (people visibly trapped or unable to get out; use this whenever that is the main rescue need).
- severity: low (limited, no direct threat to life), medium (could escalate or cause damage), high (clear risk to people), critical (direct threat to life, e.g. people in water, a building on fire with people inside, collapse).
- teams: civil_defense (general rescue, debris, building collapse), ambulance (injuries), water_rescue (people or vehicles in water), fire_rescue (fire, smoke), police (traffic control, closed roads).
- findings: the concrete visual facts that drove the rating (water depth against cars, size of the fire, visible people, damage), short enough to scan.
- confidence: how sure you are from the photo alone.

If the photo shows no emergency, set is_incident to false, pick the closest hazard, set severity to low and say so in the findings. Never identify people.`;

/** Preliminary analysis of an incident photo with Claude; null if the model declined. */
async function analyzeWithClaude(client: Anthropic, dataUrl: string, hint: HazardType | "unknown") {
  const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error("Unsupported image");
  const [, mediaType, data] = match;
  const response = await client.beta.messages.parse(
    {
      model: "claude-opus-5-5",
      max_tokens: 2048,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: zodOutputFormat(ImageSchema) },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType as "image/jpeg", data },
            },
            {
              type: "text",
              text: `Incident photo from a resident in Riyadh. Hazard they selected: ${hint}. The photo wins if they disagree.`,
            },
          ],
        },
      ],
    },
    { timeout: 25_000 },
  );

  if (response.stop_reason === "refusal" || !response.parsed_output) return null;
  const out = response.parsed_output;
  const teams = out.teams.length > 0 ? [...new Set(out.teams)].slice(0, 3) : [TEAM_FOR[out.hazard]];
  return {
    hazard: out.hazard,
    severity: out.is_incident ? out.severity : "low",
    teams,
    findings: { ar: out.findings_ar, en: out.findings_en },
    confidence: Math.max(0, Math.min(1, out.confidence)),
    source: "ai",
  } satisfies ImageAnalysis;
}

const TEAM_FOR: Record<HazardType, (typeof TEAM_TYPES)[number]> = {
  flood: "water_rescue",
  fire: "fire_rescue",
  missile: "civil_defense",
  collapse: "civil_defense",
  trapped: "civil_defense",
};

const SIMULATED: Record<HazardType, { severity: Severity; findings: Bilingual }> = {
  flood: {
    severity: "high",
    findings: {
      ar: "مياه جارية تغمر الطريق ومستوى المياه يقترب من منتصف إطارات السيارات. احتمال وجود مركبات عالقة.",
      en: "Moving water covers the road and reaches about half-way up the car wheels. Vehicles may be stranded.",
    },
  },
  fire: {
    severity: "high",
    findings: {
      ar: "دخان كثيف ولهب ظاهر من مبنى. خطر انتشار الحريق للمباني المجاورة واحتمال وجود أشخاص بالداخل.",
      en: "Thick smoke and visible flames from a building. Risk of spread to nearby buildings; people may be inside.",
    },
  },
  missile: {
    severity: "critical",
    findings: {
      ar: "أضرار ناتجة عن سقوط شظايا وحطام متناثر. يجب إبعاد الناس عن الموقع حتى تأمينه.",
      en: "Damage from falling debris with scattered fragments. Keep people away until the site is secured.",
    },
  },
  collapse: {
    severity: "high",
    findings: {
      ar: "انهيار جزئي في مبنى مع ركام متساقط وتشققات في الجدران. احتمال وجود أشخاص تحت الأنقاض وخطر انهيار إضافي.",
      en: "Partial building collapse with fallen debris and cracked walls. People may be under the rubble and more may fall.",
    },
  },
  trapped: {
    severity: "critical",
    findings: {
      ar: "أشخاص يبدون عالقين ولا يستطيعون الخروج بأنفسهم. يلزم تدخل فرق الإنقاذ فورًا.",
      en: "People appear trapped and unable to get out on their own. Rescue teams are needed now.",
    },
  },
};

/** Stable pseudo-random pick from the image bytes, so the same photo gives the same result. */
function hashOf(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i += 97) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Demo analysis used when the AI service is unavailable. */
export function simulateImageAnalysis(dataUrl: string, hint: HazardType | "unknown"): ImageAnalysis {
  const h = hashOf(dataUrl);
  const hazard = hint !== "unknown" ? hint : HAZARDS[h % HAZARDS.length];
  const { severity, findings } = SIMULATED[hazard];
  const injured = severity === "high" || severity === "critical";
  return {
    hazard,
    severity,
    teams: planResources(hazard, severity, NO_AFFECTED, injured).teams.map((t) => t.type),
    findings,
    confidence: 0.62 + (h % 25) / 100,
    source: "simulated",
  };
}

/** Analyse an incident photo with Claude, falling back to a simulated result. */
export async function analyzeImage(dataUrl: string, hint: HazardType | "unknown"): Promise<ImageAnalysis> {
  if (process.env.TRIAGE_MODE !== "rules") {
    try {
      const result = await analyzeWithClaude(new Anthropic(), dataUrl, hint);
      if (result) return result;
    } catch (err) {
      if (err instanceof Anthropic.APIError) {
        console.error(`Claude image analysis failed (${err.status ?? "network"}): ${err.message}`);
      } else {
        console.warn(`Claude image analysis unavailable, simulating: ${err instanceof Error ? err.message : err}`);
      }
    }
  }
  return simulateImageAnalysis(dataUrl, hint);
}
