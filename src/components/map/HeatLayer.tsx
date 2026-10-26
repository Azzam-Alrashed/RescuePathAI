"use client";

import { Rectangle } from "react-leaflet";
import { distanceM, isInZone } from "@/lib/geo";
import type { LatLng, Scenario, Severity } from "@/lib/types";

// Riyadh demo area and a ~800 m grid.
const BOUNDS = { south: 24.54, north: 24.86, west: 46.52, east: 46.86 };
const CELL_DEG = 0.0075;
const INFLUENCE_M = 1800;

const SEVERITY_WEIGHT: Record<Severity, number> = { low: 1, medium: 2, high: 3.5, critical: 5 };
const ZONE_WEIGHT = 1.5;

/** Green → yellow → orange → red. */
const RAMP = ["#22c55e", "#eab308", "#f97316", "#dc2626"];

export interface HeatPoint {
  position: LatLng;
  severity: Severity;
}

/**
 * Risk heat map: each open report spreads weight to nearby cells (by
 * severity, fading with distance) and active danger zones add a base level.
 */
function heatCells(points: HeatPoint[], scenarios: Scenario[]) {
  const raw: { bounds: [LatLng, LatLng]; weight: number }[] = [];
  let max = 0;
  for (let lat = BOUNDS.south; lat < BOUNDS.north; lat += CELL_DEG) {
    for (let lng = BOUNDS.west; lng < BOUNDS.east; lng += CELL_DEG) {
      const center: LatLng = [lat + CELL_DEG / 2, lng + CELL_DEG / 2];
      let w = 0;
      for (const p of points) {
        const d = distanceM(center, p.position);
        if (d < INFLUENCE_M) w += SEVERITY_WEIGHT[p.severity] * (1 - d / INFLUENCE_M);
      }
      if (scenarios.some((s) => isInZone(center, s.zone))) w += ZONE_WEIGHT;
      if (w > 0.25) {
        raw.push({
          bounds: [
            [lat, lng],
            [lat + CELL_DEG, lng + CELL_DEG],
          ],
          weight: w,
        });
        max = Math.max(max, w);
      }
    }
  }
  return raw.map((c) => ({
    ...c,
    level: Math.min(RAMP.length - 1, Math.floor((c.weight / Math.max(max, 4)) * RAMP.length)),
  }));
}

export function HeatLayer({ points, scenarios }: { points: HeatPoint[]; scenarios: Scenario[] }) {
  const cells = heatCells(points, scenarios);

  return (
    <>
      {cells.map((c) => (
        <Rectangle
          key={`${c.bounds[0][0].toFixed(4)},${c.bounds[0][1].toFixed(4)}`}
          bounds={c.bounds}
          interactive={false}
          pathOptions={{ stroke: false, fillColor: RAMP[c.level], fillOpacity: 0.2 + c.level * 0.1 }}
        />
      ))}
    </>
  );
}

export function HeatLegend({ low, high, title }: { low: string; high: string; title: string }) {
  return (
    <div className="rounded-xl bg-white/95 px-3 py-2 text-xs shadow-lg dark:bg-slate-900/95">
      <div className="mb-1 font-semibold">{title}</div>
      <div className="h-2 w-36 rounded-full" style={{ background: `linear-gradient(to right, ${RAMP.join(",")})` }} />
      <div className="mt-0.5 flex justify-between text-slate-500">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}
