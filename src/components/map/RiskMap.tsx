"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import { Circle, MapContainer, Marker, Polygon, Polyline, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import { SAFE_PLACES } from "@/lib/data/safe-places";
import { HAZARD_ICONS, useI18n } from "@/lib/i18n";
import { useAppState } from "@/lib/store";
import type { GuidanceRoute } from "@/lib/use-guidance-route";
import type { HazardType, LatLng, SafePlace, Zone } from "@/lib/types";

const RIYADH_CENTER: LatLng = [24.713, 46.675];

const HAZARD_COLOR: Record<HazardType, string> = {
  missile: "#dc2626",
  flood: "#2563eb",
  fire: "#ea580c",
  road: "#ca8a04",
  trapped: "#9333ea",
};

function emojiIcon(emoji: string, className: string) {
  return L.divIcon({
    html: `<span>${emoji}</span>`,
    className: `rpa-marker ${className}`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

const userIcon = L.divIcon({
  html: '<span class="rpa-user-dot"></span>',
  className: "rpa-user",
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

function ZoneShape({ zone, color }: { zone: Zone; color: string }) {
  const style = { color, weight: 2, fillColor: color, fillOpacity: 0.18, dashArray: "6 4" };
  return zone.kind === "circle" ? (
    <Circle center={zone.center} radius={zone.radiusM} pathOptions={style} />
  ) : (
    <Polygon positions={zone.points} pathOptions={style} />
  );
}

/** Re-centres the map when the store asks for it. */
function FocusController() {
  const map = useMap();
  const { focusKey, scenario, userPos } = useAppState();
  useEffect(() => {
    if (focusKey === 0) return;
    if (scenario) map.flyTo(scenario.focus.center, scenario.focus.zoom, { duration: 1 });
    else map.flyTo(userPos, 13, { duration: 1 });
    // Only react to explicit focus requests, not every position change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey]);
  return null;
}

export default function RiskMap({ guidance }: { guidance: GuidanceRoute }) {
  const { t, pick, formatNumber, locale } = useI18n();
  const { scenario, userPos, setUserPos } = useAppState();

  const icons = useMemo(
    () => ({
      shelter: emojiIcon("🛡️", "rpa-marker--shelter"),
      assembly: emojiIcon("🚩", "rpa-marker--assembly"),
      hazard: Object.fromEntries(
        (Object.keys(HAZARD_ICONS) as HazardType[]).map((h) => [h, emojiIcon(HAZARD_ICONS[h], "rpa-marker--hazard")]),
      ) as Record<HazardType, L.DivIcon>,
    }),
    [],
  );

  const userMarkerHandlers = useMemo(
    () => ({
      dragend(e: L.LeafletEvent) {
        const { lat, lng } = (e.target as L.Marker).getLatLng();
        setUserPos([lat, lng]);
      },
    }),
    [setUserPos],
  );

  // During a scenario show only places relevant to the protective action.
  const visiblePlaces: SafePlace[] = scenario
    ? SAFE_PLACES.filter((p) => (scenario.action === "shelter" ? p.kind === "shelter" : p.kind === "assembly"))
    : SAFE_PLACES;

  const routeColor = scenario?.action === "shelter" ? "#16a34a" : "#0891b2";

  return (
    <div dir="ltr" className="h-full w-full">
      <MapContainer center={RIYADH_CENTER} zoom={12} className="h-full w-full" zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <FocusController />

        {scenario && (
          <>
            <ZoneShape zone={scenario.zone} color={HAZARD_COLOR[scenario.hazard]} />
            {scenario.closedRoads.map((road) => (
              <Polyline
                key={road.id}
                positions={road.path}
                pathOptions={{ color: "#111827", weight: 6, opacity: 0.85, dashArray: "2 10", lineCap: "round" }}
              >
                <Tooltip sticky>⛔ {pick(road.label)}</Tooltip>
              </Polyline>
            ))}
            {scenario.incidents.map((inc) => (
              <Marker key={inc.id} position={inc.position} icon={icons.hazard[inc.type]}>
                <Popup>
                  <div dir={locale === "ar" ? "rtl" : "ltr"}>{pick(inc.label)}</div>
                </Popup>
              </Marker>
            ))}
          </>
        )}

        {guidance.route && (
          <>
            <Polyline positions={guidance.route.path} pathOptions={{ color: "#ffffff", weight: 9, opacity: 0.9 }} />
            <Polyline
              positions={guidance.route.path}
              pathOptions={{
                color: routeColor,
                weight: 5,
                dashArray: guidance.route.routed ? undefined : "8 8",
              }}
            />
          </>
        )}

        {visiblePlaces.map((place) => (
          <Marker
            key={place.id}
            position={place.position}
            icon={place.kind === "shelter" ? icons.shelter : icons.assembly}
            opacity={guidance.destination && guidance.destination.id !== place.id ? 0.6 : 1}
          >
            <Popup>
              <div dir={locale === "ar" ? "rtl" : "ltr"} className="text-sm">
                <strong>{pick(place.name)}</strong>
                <br />
                {place.kind === "shelter" ? t("mapShelter") : t("mapAssembly")} · {t("mapCapacity")}:{" "}
                {formatNumber(place.capacity)}
              </div>
            </Popup>
          </Marker>
        ))}

        <Marker
          position={userPos}
          icon={userIcon}
          draggable
          eventHandlers={userMarkerHandlers}
          zIndexOffset={1000}
        >
          <Tooltip direction="top" offset={[0, -12]}>
            {t("mapYou")}
          </Tooltip>
        </Marker>
      </MapContainer>
    </div>
  );
}
