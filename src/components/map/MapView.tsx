"use client";

import dynamic from "next/dynamic";
import { useLayoutEffect, useState } from "react";
import { MapSkeleton } from "@/components/map/MapSkeleton";
import type { GuidanceRoute } from "@/lib/use-guidance-route";

// Leaflet touches `window` on import, so the map is client-only.
const RiskMap = dynamic(() => import("./RiskMap"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

/**
 * Next.js hides pages you navigate away from (React <Activity>) instead of
 * unmounting them. Leaflet tears the map down when hidden but react-leaflet
 * keeps the dead instance, so bump a key on hide to rebuild it when shown.
 */
export function useFreshMapKey() {
  const [key, setKey] = useState(0);
  useLayoutEffect(() => () => setKey((k) => k + 1), []);
  return key;
}

export function MapView({ guidance }: { guidance: GuidanceRoute }) {
  const key = useFreshMapKey();
  return <RiskMap key={key} guidance={guidance} />;
}
