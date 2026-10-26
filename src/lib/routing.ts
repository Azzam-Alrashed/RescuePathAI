import { distanceM, distanceToPathM, isInZone, offsetM } from "@/lib/geo";
import type { LatLng, Route, Zone } from "@/lib/types";

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

function toRoute(r: { geometry: { coordinates: [number, number][] }; distance: number; duration: number }): Route {
  return {
    // OSRM returns lng,lat.
    path: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distanceM: r.distance,
    durationS: r.duration,
    routed: true,
  };
}

/** Street routes through the given points (main route first, then alternatives); straight line on failure. */
async function fetchRoutes(points: LatLng[], mode: TravelMode, signal?: AbortSignal): Promise<Route[]> {
  const from = points[0];
  const to = points[points.length - 1];
  const coords = points.map(([lat, lng]) => `${lng},${lat}`).join(";");
  const alternatives = points.length === 2 ? "&alternatives=2" : "";
  const url = `${OSRM_BASE[mode]}/${coords}?overview=full&geometries=geojson${alternatives}`;
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return [straightLine(from, to, mode)];
    const data = await res.json();
    const routes = (data.routes ?? []).map(toRoute);
    return routes.length > 0 ? routes : [straightLine(from, to, mode)];
  } catch (err) {
    if (signal?.aborted) throw err;
    return [straightLine(from, to, mode)];
  }
}

/** Fetches a street route; falls back to a straight line when offline or the service fails. */
export async function fetchRoute(from: LatLng, to: LatLng, mode: TravelMode, signal?: AbortSignal): Promise<Route> {
  return (await fetchRoutes([from, to], mode, signal))[0];
}

/** Places a route must keep away from. */
export interface Hazards {
  closedRoads: LatLng[][];
  zones: Zone[];
}

const CLOSED_ROAD_CLEARANCE_M = 60;
const DETOUR_OFFSET_M = 1500;

/** Where a route runs into a hazard, or null if it is clear. */
export function firstConflict(path: LatLng[], hazards: Hazards): LatLng | null {
  for (const p of path) {
    if (hazards.zones.some((z) => isInZone(p, z))) return p;
    if (hazards.closedRoads.some((road) => distanceToPathM(p, road) < CLOSED_ROAD_CLEARANCE_M)) return p;
  }
  return null;
}

/** A waypoint to the side of the conflict, away from the straight line between the ends. */
function detourWaypoint(from: LatLng, to: LatLng, conflict: LatLng, side: 1 | -1): LatLng {
  // Unit vector perpendicular to from→to, in metres.
  const north = (to[0] - from[0]) * 110_540;
  const east = (to[1] - from[1]) * 111_320 * Math.cos((from[0] * Math.PI) / 180);
  const len = Math.hypot(north, east) || 1;
  return offsetM(conflict, (side * -east * DETOUR_OFFSET_M) / len, (side * north * DETOUR_OFFSET_M) / len);
}

export interface SafeRoute {
  route: Route;
  /** The direct route, when it was rejected for crossing a hazard. */
  blocked: Route | null;
}

/**
 * The best route that avoids closed roads and other danger zones: the main
 * route if it is clear, else a clear alternative, else a detour around the
 * first conflict (simulated: we only know the hazards in the demo data).
 */
export async function fetchSafeRoute(
  from: LatLng,
  to: LatLng,
  mode: TravelMode,
  hazards: Hazards,
  signal?: AbortSignal,
): Promise<SafeRoute> {
  const routes = await fetchRoutes([from, to], mode, signal);
  const main = routes[0];
  const conflict = firstConflict(main.path, hazards);
  if (!conflict) return { route: main, blocked: null };

  const clearAlt = routes.slice(1).find((r) => !firstConflict(r.path, hazards));
  if (clearAlt) return { route: { ...clearAlt, alternative: true }, blocked: main };

  for (const side of [1, -1] as const) {
    const via = detourWaypoint(from, to, conflict, side);
    const [detour] = await fetchRoutes([from, via, to], mode, signal);
    if (!detour.routed) {
      // Offline: show the detour as straight segments.
      const d = distanceM(from, via) + distanceM(via, to);
      return {
        route: {
          path: [from, via, to],
          distanceM: d,
          durationS: d / ASSUMED_SPEED_MPS[mode],
          routed: false,
          alternative: true,
        },
        blocked: main,
      };
    }
    if (!firstConflict(detour.path, hazards)) return { route: { ...detour, alternative: true }, blocked: main };
  }
  // Nothing clear found: keep the main route, flagged so the UI can warn.
  return { route: main, blocked: main };
}
