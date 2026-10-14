import { z } from "zod";
import { addCase, findCase, getResponseUpdates } from "@/lib/server/ops-store";
import { HAZARDS, triageReport } from "@/lib/triage";

const ReportSchema = z.object({
  id: z.string().uuid(),
  hazard: z.enum([...HAZARDS, "unknown"]),
  description: z.string().max(2000),
  peopleCount: z.number().int().min(1).max(500),
  vulnerable: z.object({ children: z.boolean(), elderly: z.boolean(), disabled: z.boolean() }),
  shareVulnerable: z.boolean(),
  position: z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)]),
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
