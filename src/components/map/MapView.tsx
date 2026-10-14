"use client";

import dynamic from "next/dynamic";
import type { GuidanceRoute } from "@/lib/use-guidance-route";

// Leaflet touches `window` on import, so the map is client-only.
const RiskMap = dynamic(() => import("./RiskMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-slate-200 dark:bg-slate-800" />,
});

export function MapView({ guidance }: { guidance: GuidanceRoute }) {
  return <RiskMap guidance={guidance} />;
}
