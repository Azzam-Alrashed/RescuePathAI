import { z } from "zod";
import { applyCaseAction, getOpsState, OpsError } from "@/lib/server/ops-store";
import { SEVERITIES } from "@/lib/triage";

const ActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("review"), severity: z.enum(SEVERITIES) }),
  z.object({ action: z.literal("assign"), teamId: z.string() }),
  z.object({ action: z.literal("on_scene") }),
  z.object({ action: z.literal("resolve") }),
]);

/** A dispatcher's decision on a case. Returns the updated operations picture. */
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const parsed = ActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid action" }, { status: 400 });
  }
  try {
    applyCaseAction(id, parsed.data);
  } catch (err) {
    if (err instanceof OpsError) {
      return Response.json({ error: err.message, state: getOpsState() }, { status: 409 });
    }
    throw err;
  }
  return Response.json(getOpsState());
}
