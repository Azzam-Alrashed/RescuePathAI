"use client";

import { useEffect, useMemo, useState } from "react";
import { SAFE_PLACES } from "@/lib/data/safe-places";
import { nearestSafePlace } from "@/lib/geo";
import { fetchRoute, straightLine, type TravelMode } from "@/lib/routing";
import { useAppState } from "@/lib/store";
import type { Route, SafePlace } from "@/lib/types";

export interface GuidanceRoute {
  destination: SafePlace | null;
  mode: TravelMode;
  route: Route | null;
  loading: boolean;
}

/** Suggested destination and route for the resident while they're inside an active zone. */
export function useGuidanceRoute(): GuidanceRoute {
  const { scenario, inZone, userPos, offline } = useAppState();
  // The route plus the request it answers, so a stale route is never shown as current.
  const [result, setResult] = useState<{ key: string; route: Route } | null>(null);

  const mode: TravelMode = scenario?.action === "shelter" ? "foot" : "car";

  const destination = useMemo(
    () =>
      scenario && inZone && scenario.action !== "avoid"
        ? nearestSafePlace(userPos, scenario.action, scenario.zone, SAFE_PLACES)
        : null,
    [scenario, inZone, userPos],
  );

  const requestKey = destination ? `${destination.id}|${userPos.join(",")}|${mode}|${offline}` : null;

  useEffect(() => {
    if (!destination || !requestKey) return;
    const controller = new AbortController();
    // Debounce so dragging the marker doesn't spam the routing service.
    const timer = setTimeout(async () => {
      try {
        const route = offline
          ? straightLine(userPos, destination.position, mode)
          : await fetchRoute(userPos, destination.position, mode, controller.signal);
        setResult({ key: requestKey, route });
      } catch {
        // Aborted by a newer request.
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [destination, requestKey, userPos, mode, offline]);

  const current = result && result.key === requestKey ? result.route : null;
  return { destination, mode, route: current, loading: !!destination && !current };
}
