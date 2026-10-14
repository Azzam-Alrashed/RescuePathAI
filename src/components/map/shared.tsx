"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Circle, Polygon, TileLayer } from "react-leaflet";
import type { HazardType, LatLng, Zone } from "@/lib/types";

export const RIYADH_CENTER: LatLng = [24.713, 46.675];

export const HAZARD_COLOR: Record<HazardType, string> = {
  missile: "#dc2626",
  flood: "#2563eb",
  fire: "#ea580c",
  road: "#ca8a04",
  trapped: "#9333ea",
};

/** A round marker showing an emoji; `className` styles the ring. */
export function emojiIcon(emoji: string, className: string, size = 34) {
  return L.divIcon({
    html: `<span>${emoji}</span>`,
    className: `rpa-marker ${className}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function BaseTiles() {
  return (
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      maxZoom={19}
    />
  );
}

export function ZoneShape({ zone, color }: { zone: Zone; color: string }) {
  const style = { color, weight: 2, fillColor: color, fillOpacity: 0.18, dashArray: "6 4" };
  return zone.kind === "circle" ? (
    <Circle center={zone.center} radius={zone.radiusM} pathOptions={style} />
  ) : (
    <Polygon positions={zone.points} pathOptions={style} />
  );
}
