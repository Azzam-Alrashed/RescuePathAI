import { z } from "zod";
import { SCENARIOS } from "@/lib/data/scenarios";
import { setScenario } from "@/lib/server/ops-store";

const BodySchema = z.object({
  id: z
    .string()
    .refine((id) => SCENARIOS.some((s) => s.id === id))
    .nullable(),
});

/** The simulation panel shares the active scenario so the dashboard can show it. */
export async function PUT(request: Request) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Unknown scenario" }, { status: 400 });
  }
  setScenario(parsed.data.id);
  return new Response(null, { status: 204 });
}
