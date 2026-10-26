import { z } from "zod";
import { addCase, findCase, getResponseUpdates } from "@/lib/server/ops-store";
import { AffectedSchema, ImageAnalysisSchema } from "@/lib/server/schemas";
import { HAZARDS, triageReport } from "@/lib/triage";

const ReportSchema = z.object({
  id: z.string().uuid(),
  hazard: z.enum([...HAZARDS, "unknown"]),
  description: z.string().max(2000),
  affected: AffectedSchema,
  shareVulnerable: z.boolean(),
  position: z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)]),
  channel: z.enum(["text", "photo", "voice", "sos"]),
  // Downscaled in the browser; ~1024px JPEG.
  photo: z
    .string()
    .max(1_500_000)
    .regex(/^data:image\/jpeg;base64,/)
    .optional(),
  photoAnalysis: ImageAnalysisSchema.optional(),
});

/** A resident submits an SOS: triage it and open a case for the operations centre. */
export async function POST(request: Request) {
  const parsed = ReportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid report" }, { status: 400 });
  }
  const { id, ...input } = parsed.data;

  // A retried send returns the existing case instead of triaging it twice.
  const existing = findCase(id);
  if (existing) return Response.json({ triage: existing.triage });

  const triage = await triageReport(input);
  const created = addCase(id, input, triage);
  return Response.json({ triage: created.triage });
}

/** Residents poll the response status of their own reports: /api/reports?ids=a,b */
export async function GET(request: Request) {
  const ids = (new URL(request.url).searchParams.get("ids") ?? "").split(",").filter(Boolean).slice(0, 50);
  return Response.json(getResponseUpdates(ids));
}
