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

/** Distance from a point to a segment in metres (local flat projection, fine at city scale). */
export function pointSegmentDistanceM(p: LatLng, a: LatLng, b: LatLng): number {
  const kx = 111_320 * Math.cos(toRad(p[0]));
  const ky = 110_540;
  const [px, py] = [p[1] * kx, p[0] * ky];
  const [ax, ay] = [a[1] * kx, a[0] * ky];
  const [bx, by] = [b[1] * kx, b[0] * ky];
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Shortest distance from a point to a polyline, in metres. */
export function distanceToPathM(p: LatLng, path: LatLng[]): number {
  let best = Infinity;
  for (let i = 1; i < path.length; i++) best = Math.min(best, pointSegmentDistanceM(p, path[i - 1], path[i]));
  return best;
}

/** Moves a point by metres north and east. */
export function offsetM([lat, lng]: LatLng, northM: number, eastM: number): LatLng {
  return [lat + northM / 110_540, lng + eastM / (111_320 * Math.cos(toRad(lat)))];
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
