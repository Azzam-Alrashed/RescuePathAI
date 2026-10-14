"use client";

import L from "leaflet";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup, Tooltip, useMap } from "react-leaflet";
import { Ban } from "lucide-react";
import {
  BaseTiles,
  HAZARD_COLOR,
  HAZARD_NODE,
  PLACE_NODE,
  pinIcon,
  RIYADH_CENTER,
  ZoneShape,
} from "@/components/map/shared";
import { SAFE_PLACES } from "@/lib/data/safe-places";
import { useI18n } from "@/lib/i18n";
import { useAppState } from "@/lib/store";
import type { GuidanceRoute } from "@/lib/use-guidance-route";
import type { HazardType, SafePlace, SafePlaceKind } from "@/lib/types";

const PLACE_COLOR: Record<SafePlaceKind, string> = {
  shelter: "#059669",
  assembly: "#0891b2",
};

const userIcon = L.divIcon({
  html: '<span class="rpa-user-dot"></span>',
  className: "rpa-user",
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

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

  const icons = useMemo(() => {
    const place = (kind: SafePlaceKind, target: boolean) =>
      pinIcon(PLACE_NODE[kind], {
        color: PLACE_COLOR[kind],
        variant: target ? "solid" : "outline",
        size: target ? 38 : 28,
        selected: target,
      });
    return {
      place: {
        shelter: place("shelter", false),
        assembly: place("assembly", false),
      },
      target: {
        shelter: place("shelter", true),
        assembly: place("assembly", true),
      },
      hazard: Object.fromEntries(
        (Object.keys(HAZARD_COLOR) as HazardType[]).map((h) => [
          h,
          pinIcon(HAZARD_NODE[h], {
            color: HAZARD_COLOR[h],
            size: 36,
            pulse: true,
          }),
        ]),
      ) as Record<HazardType, L.DivIcon>,
    };
  }, []);

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

  const routeColor = scenario?.action === "shelter" ? PLACE_COLOR.shelter : PLACE_COLOR.assembly;

  return (
    <div dir="ltr" className="h-full w-full">
      <MapContainer center={RIYADH_CENTER} zoom={12} className="h-full w-full" zoomControl={false}>
        <BaseTiles />
        <FocusController />

        {scenario && (
          <>
            <ZoneShape zone={scenario.zone} color={HAZARD_COLOR[scenario.hazard]} />
            {scenario.closedRoads.map((road) => (
              <Polyline
                key={road.id}
                positions={road.path}
                pathOptions={{
                  color: "#111827",
                  weight: 6,
                  opacity: 0.85,
                  dashArray: "2 10",
                  lineCap: "round",
                }}
              >
                <Tooltip sticky>
                  <span className="inline-flex items-center gap-1.5">
                    <Ban size={14} className="text-red-600" aria-hidden />
                    {pick(road.label)}
                  </span>
                </Tooltip>
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

        {visiblePlaces.map((place) => {
          const isTarget = guidance.destination?.id === place.id;
          return (
            <Marker
              key={place.id}
              position={place.position}
              icon={(isTarget ? icons.target : icons.place)[place.kind]}
              opacity={guidance.destination && !isTarget ? 0.55 : 1}
              zIndexOffset={isTarget ? 500 : 0}
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
          );
        })}

        <Marker position={userPos} icon={userIcon} draggable eventHandlers={userMarkerHandlers} zIndexOffset={1000}>
          <Tooltip direction="top" offset={[0, -12]}>
            {t("mapYou")}
          </Tooltip>
        </Marker>
      </MapContainer>
    </div>
  );
}
