import { connection } from "next/server";
import { getOpsState } from "@/lib/server/ops-store";

/** Full operations picture for the dispatcher dashboard. */
export async function GET() {
  // Live data: opt out of build-time prerendering.
  await connection();
  return Response.json(getOpsState());
}
