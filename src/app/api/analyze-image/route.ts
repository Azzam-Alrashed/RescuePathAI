import { z } from "zod";
import { HAZARDS } from "@/lib/triage";
import { analyzeImage } from "@/lib/triage/image";

// Photos are downscaled in the browser to ~1024px JPEG, well under this.
const MAX_DATA_URL_CHARS = 2_000_000;

const BodySchema = z.object({
  image: z
    .string()
    .max(MAX_DATA_URL_CHARS)
    .regex(/^data:image\/(jpeg|png|webp|gif);base64,/),
  hint: z.enum([...HAZARDS, "unknown"]),
});

/** Preliminary analysis of an incident photo: hazard, severity and suggested teams. */
export async function POST(request: Request) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid image" }, { status: 400 });
  }
  return Response.json(await analyzeImage(parsed.data.image, parsed.data.hint));
}
