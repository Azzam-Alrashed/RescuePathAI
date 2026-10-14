import type { LatLng, ProtectiveAction, SafePlace, Zone } from "@/lib/types";

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in metres. */
export function distanceM([lat1, lng1]: LatLng, [lat2, lng2]: LatLng): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

/** Ray-casting point-in-polygon test (fine at city scale). */
function inPolygon([lat, lng]: LatLng, points: LatLng[]): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [latI, lngI] = points[i];
    const [latJ, lngJ] = points[j];
    const crosses = latI > lat !== latJ > lat && lng < ((lngJ - lngI) * (lat - latI)) / (latJ - latI) + lngI;
    if (crosses) inside = !inside;
  }
  return inside;
}

export function isInZone(point: LatLng, zone: Zone): boolean {
  return zone.kind === "circle" ? distanceM(point, zone.center) <= zone.radiusM : inPolygon(point, zone.points);
}

/** A point inside the zone, used by "move me into the zone" in the demo. */
export function zoneSamplePoint(zone: Zone): LatLng {
  if (zone.kind === "circle") return [zone.center[0] + 0.004, zone.center[1] - 0.006];
  const pts = zone.points;
  // Midpoint between a vertex on one bank and the opposite vertex on the other.
  const a = pts[Math.floor(pts.length / 4)];
  const b = pts[pts.length - 1 - Math.floor(pts.length / 4)];
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

/**
 * Nearest suitable safe place for the protective action:
 * shelters for "shelter", assembly points outside the zone for "evacuate".
 */
export function nearestSafePlace(
  from: LatLng,
  action: ProtectiveAction,
  zone: Zone,
  places: SafePlace[],
): SafePlace | null {
  const candidates = places.filter((p) =>
    action === "shelter" ? p.kind === "shelter" : p.kind === "assembly" && !isInZone(p.position, zone),
  );
  let best: SafePlace | null = null;
  let bestDist = Infinity;
  for (const p of candidates) {
    const d = distanceM(from, p.position);
    if (d < bestDist) {
      best = p;
      bestDist = d;
    }
  }
  return best;
}
