import { z } from "zod";
import { SCENARIOS } from "@/lib/data/scenarios";
import { setScenarios } from "@/lib/server/ops-store";

const BodySchema = z.object({
  ids: z.array(z.string().refine((id) => SCENARIOS.some((s) => s.id === id))).max(SCENARIOS.length),
});

/** The simulation panel shares the active scenarios so the dashboard can show them. */
export async function PUT(request: Request) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Unknown scenario" }, { status: 400 });
  }
  setScenarios([...new Set(parsed.data.ids)]);
  return new Response(null, { status: 204 });
}
