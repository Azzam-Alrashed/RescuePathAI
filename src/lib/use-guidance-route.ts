"use client";

import { useEffect, useMemo, useState } from "react";
import { SAFE_PLACES } from "@/lib/data/safe-places";
import { nearestSafePlace } from "@/lib/geo";
import { fetchSafeRoute, straightLine, type Hazards, type TravelMode } from "@/lib/routing";
import { useAppState } from "@/lib/store";
import type { Route, SafePlace } from "@/lib/types";

export interface GuidanceRoute {
  destination: SafePlace | null;
  mode: TravelMode;
  route: Route | null;
  /** The direct route, when it crossed a danger zone or closed road and was replaced. */
  blocked: Route | null;
  loading: boolean;
}

/** Suggested destination and route for the resident while they're inside an active zone. */
export function useGuidanceRoute(): GuidanceRoute {
  const { scenario, scenarios, inZone, userPos, offline } = useAppState();
  // The route plus the request it answers, so a stale route is never shown as current.
  const [result, setResult] = useState<{ key: string; route: Route; blocked: Route | null } | null>(null);

  // Keep away from every closed road, and from danger zones other than the one we're leaving.
  const hazards = useMemo<Hazards>(
    () => ({
      closedRoads: scenarios.flatMap((s) => s.closedRoads.map((r) => r.path)),
      zones: scenarios.filter((s) => s.id !== scenario?.id).map((s) => s.zone),
    }),
    [scenarios, scenario],
  );
  const hazardKey = scenarios.map((s) => s.id).join("+");

  const mode: TravelMode = scenario?.action === "shelter" ? "foot" : "car";

  const destination = useMemo(
    () =>
      scenario && inZone && scenario.action !== "avoid"
        ? nearestSafePlace(userPos, scenario.action, scenario.zone, SAFE_PLACES)
        : null,
    [scenario, inZone, userPos],
  );

  const requestKey = destination ? `${destination.id}|${userPos.join(",")}|${mode}|${offline}|${hazardKey}` : null;

  useEffect(() => {
    if (!destination || !requestKey) return;
    const controller = new AbortController();
    // Debounce so dragging the marker doesn't spam the routing service.
    const timer = setTimeout(async () => {
      try {
        const { route, blocked } = offline
          ? { route: straightLine(userPos, destination.position, mode), blocked: null }
          : await fetchSafeRoute(userPos, destination.position, mode, hazards, controller.signal);
        setResult({ key: requestKey, route, blocked });
      } catch {
        // Aborted by a newer request.
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [destination, requestKey, userPos, mode, offline, hazards]);

  const current = result && result.key === requestKey ? result : null;
  return {
    destination,
    mode,
    route: current?.route ?? null,
    blocked: current?.blocked ?? null,
    loading: !!destination && !current,
  };
}
