"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  Ambulance,
  CarFront,
  CircleQuestionMark,
  FireExtinguisher,
  Flag,
  Flame,
  HardHat,
  LifeBuoy,
  Rocket,
  Shield,
  ShieldCheck,
  Ship,
  WavesArrowUp,
  type IconNode,
} from "lucide";
import { useEffect } from "react";
import { Circle, Polygon, TileLayer, useMap } from "react-leaflet";
import type { HazardType, LatLng, ResponseTeam, TeamStatus, Zone } from "@/lib/types";

export const RIYADH_CENTER: LatLng = [24.713, 46.675];

export const HAZARD_COLOR: Record<HazardType, string> = {
  missile: "#dc2626",
  flood: "#2563eb",
  fire: "#ea580c",
  road: "#ca8a04",
  trapped: "#9333ea",
};

export const TEAM_STATUS_COLOR: Record<TeamStatus, string> = {
  available: "#059669",
  dispatched: "#d97706",
  on_scene: "#2563eb",
};

// Leaflet markers take HTML strings, so they use the framework-free `lucide`
// package: the same icons as `lucide-react` in the rest of the UI.
export const HAZARD_NODE: Record<HazardType | "unknown", IconNode> = {
  missile: Rocket,
  flood: WavesArrowUp,
  fire: Flame,
  road: CarFront,
  trapped: LifeBuoy,
  unknown: CircleQuestionMark,
};

export const TEAM_NODE: Record<ResponseTeam, IconNode> = {
  civil_defense: HardHat,
  ambulance: Ambulance,
  water_rescue: Ship,
  fire_rescue: FireExtinguisher,
  police: Shield,
};

export const PLACE_NODE = { shelter: ShieldCheck, assembly: Flag } as const;

function svg(node: IconNode, size: number): string {
  const children = node
    .map(([tag, attrs]) => {
      const a = Object.entries(attrs)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${k}="${v}"`)
        .join(" ");
      return `<${tag} ${a}/>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${children}</svg>`;
}

export interface PinOptions {
  color: string;
  /** solid: coloured disc with a white icon; outline: white disc with a coloured icon. */
  variant?: "solid" | "outline";
  shape?: "round" | "square";
  size?: number;
  pulse?: boolean;
  selected?: boolean;
}

// Reusing icon objects stops Leaflet re-creating marker DOM (and restarting
// the pulse animation) every time the dashboard polls.
const pinCache = new WeakMap<IconNode, Map<string, L.DivIcon>>();

/** A map marker showing a Lucide icon. */
export function pinIcon(node: IconNode, options: PinOptions): L.DivIcon {
  const key = JSON.stringify(options);
  let byOptions = pinCache.get(node);
  if (!byOptions) pinCache.set(node, (byOptions = new Map()));
  let icon = byOptions.get(key);
  if (!icon) byOptions.set(key, (icon = createPin(node, options)));
  return icon;
}

function createPin(
  node: IconNode,
  { color, variant = "solid", shape = "round", size = 32, pulse, selected }: PinOptions,
) {
  const classes = [
    "rpa-pin",
    `rpa-pin--${variant}`,
    shape === "square" && "rpa-pin--square",
    pulse && "rpa-pin--pulse",
    selected && "rpa-pin--selected",
  ]
    .filter(Boolean)
    .join(" ");
  return L.divIcon({
    html: `<span class="${classes}" style="--pin:${color}">${svg(node, Math.round(size * 0.5))}</span>`,
    className: "rpa-icon",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/** Keeps Leaflet's idea of the map size in sync with the layout, and tidies up on unmount. */
function SizeSync() {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => {
      observer.disconnect();
      // Stop any fly/zoom animation if the map unmounts mid-flight (Leaflet would throw).
      map.stop();
    };
  }, [map]);
  return null;
}

/** OpenStreetMap tiles (Arabic labels in Riyadh), muted in CSS so the overlays stand out. */
export function BaseTiles() {
  return (
    <>
      <SizeSync />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
    </>
  );
}

export function ZoneShape({ zone, color }: { zone: Zone; color: string }) {
  const style = { color, weight: 2, fillColor: color, fillOpacity: 0.16, dashArray: "6 6" };
  return zone.kind === "circle" ? (
    <Circle center={zone.center} radius={zone.radiusM} pathOptions={style} />
  ) : (
    <Polygon positions={zone.points} pathOptions={style} />
  );
}
