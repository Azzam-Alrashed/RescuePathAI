import { getOpsState, resetOps } from "@/lib/server/ops-store";

/** Restores the demo cases and teams. */
export async function POST() {
  resetOps();
  return Response.json(getOpsState());
}
