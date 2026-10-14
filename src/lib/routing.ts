import { distanceM } from "@/lib/geo";
import type { LatLng, Route } from "@/lib/types";

export type TravelMode = "foot" | "car";

// Public OSRM instances run by FOSSGIS (fair-use, fine for a prototype).
const OSRM_BASE: Record<TravelMode, string> = {
  foot: "https://routing.openstreetmap.de/routed-foot/route/v1/foot",
  car: "https://routing.openstreetmap.de/routed-car/route/v1/driving",
};

const ASSUMED_SPEED_MPS: Record<TravelMode, number> = { foot: 1.3, car: 8 };

export function straightLine(from: LatLng, to: LatLng, mode: TravelMode): Route {
  const d = distanceM(from, to);
  return { path: [from, to], distanceM: d, durationS: d / ASSUMED_SPEED_MPS[mode], routed: false };
}

/** Fetches a street route; falls back to a straight line when offline or the service fails. */
export async function fetchRoute(
  from: LatLng,
  to: LatLng,
  mode: TravelMode,
  signal?: AbortSignal,
): Promise<Route> {
  // OSRM takes lng,lat order.
  const coords = `${from[1]},${from[0]};${to[1]},${to[0]}`;
  const url = `${OSRM_BASE[mode]}/${coords}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return straightLine(from, to, mode);
    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) return straightLine(from, to, mode);
    return {
      path: (route.geometry.coordinates as [number, number][]).map(([lng, lat]) => [lat, lng]),
      distanceM: route.distance,
      durationS: route.duration,
      routed: true,
    };
  } catch (err) {
    if (signal?.aborted) throw err;
    return straightLine(from, to, mode);
  }
}
