"use client";

import { Flame } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, Tooltip, useMap } from "react-leaflet";
import { HeatLayer, HeatLegend } from "@/components/map/HeatLayer";
import {
  BaseTiles,
  DangerLayer,
  HAZARD_NODE,
  pinIcon,
  RIYADH_CENTER,
  TEAM_NODE,
  TEAM_STATUS_COLOR,
} from "@/components/map/shared";
import { SEVERITY_COLOR, SeverityDot } from "@/components/severity";
import { SCENARIOS } from "@/lib/data/scenarios";
import { effectiveSeverity, isOpen, type TeamOption } from "@/lib/dispatch";
import { firstConflict, type Hazards } from "@/lib/routing";
import { distanceM, offsetM } from "@/lib/geo";
import { HAZARD_LABELS, useI18n } from "@/lib/i18n";
import type { LatLng, OpsState, SosCase } from "@/lib/types";

interface Props {
  state: OpsState;
  plan: Map<string, TeamOption[]>;
  selected: SosCase | null;
  onSelect: (id: string) => void;
}

/** Pans to the selected case. */
function FollowSelection({ selected }: { selected: SosCase | null }) {
  const map = useMap();
  const id = selected?.id;
  useEffect(() => {
    if (selected) map.flyTo(selected.position, Math.max(map.getZoom(), 13), { duration: 0.8 });
    // Only when the selection changes, not on every poll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  return null;
}

/**
 * Response line from a team base to a case. Simulated: a straight line, bent
 * around any closed road it would cross so the team takes an alternative way.
 */
function responsePath(from: LatLng, to: LatLng, hazards: Hazards): { path: LatLng[]; alternative: boolean } {
  const steps = 24;
  const straight: LatLng[] = Array.from({ length: steps + 1 }, (_, i) => [
    from[0] + ((to[0] - from[0]) * i) / steps,
    from[1] + ((to[1] - from[1]) * i) / steps,
  ]);
  const conflict = firstConflict(straight, hazards);
  if (!conflict) return { path: [from, to], alternative: false };
  // Bend around the conflict, sideways from the line.
  const len = distanceM(from, to) || 1;
  const north = (to[0] - from[0]) * 110_540;
  const east = (to[1] - from[1]) * 111_320 * Math.cos((from[0] * Math.PI) / 180);
  const via = offsetM(conflict, (-east / len) * 1200, (north / len) * 1200);
  return { path: [from, via, to], alternative: true };
}

export default function OpsMap({ state, plan, selected, onSelect }: Props) {
  const { pick, t } = useI18n();
  const [heat, setHeat] = useState(false);
  const scenarios = SCENARIOS.filter((s) => state.scenarioIds.includes(s.id));
  const openCases = state.cases.filter(isOpen);
  const teamById = useMemo(() => new Map(state.teams.map((tm) => [tm.id, tm])), [state.teams]);
  const suggestions = selected ? (plan.get(selected.id) ?? []) : [];
  const suggestedIds = new Set(suggestions.map((s) => s.team.id));
  // Teams can enter danger zones to reach a case, but not closed roads.
  const hazards: Hazards = { closedRoads: scenarios.flatMap((s) => s.closedRoads.map((r) => r.path)), zones: [] };
  const heatPoints = openCases.map((c) => ({ position: c.position, severity: effectiveSeverity(c) }));

  return (
    <div dir="ltr" className="relative h-full w-full">
      <MapContainer center={RIYADH_CENTER} zoom={11} className="h-full w-full">
        <BaseTiles />
        <FollowSelection selected={selected} />

        {heat && <HeatLayer points={heatPoints} scenarios={scenarios} />}

        {scenarios.map((s) => (
          <DangerLayer
            key={s.id}
            scenario={s}
            labels={{ zone: t("dangerZone"), road: t("closedRoadWarning") }}
            pick={pick}
          />
        ))}

        {/* Teams on their way or on scene */}
        {openCases.flatMap((c) =>
          c.teamIds.map((id) => {
            const team = teamById.get(id);
            if (!team) return null;
            const { path, alternative } = responsePath(team.base, c.position, hazards);
            return (
              <Polyline
                key={`route-${c.id}-${id}`}
                positions={path}
                pathOptions={{ color: TEAM_STATUS_COLOR[team.status], weight: 3, opacity: 0.85 }}
              >
                {alternative && <Tooltip sticky>{t("alternativeRoute")}</Tooltip>}
              </Polyline>
            );
          }),
        )}

        {/* Suggested (not yet approved) assignments for the selected case */}
        {selected &&
          suggestions.map((s) => (
            <Polyline
              key={`sugg-${s.team.id}`}
              positions={responsePath(s.team.base, selected.position, hazards).path}
              pathOptions={{ color: TEAM_STATUS_COLOR.available, weight: 3, dashArray: "6 8" }}
            />
          ))}

        {state.teams.map((team) => (
          <Marker
            key={team.id}
            position={team.base}
            icon={pinIcon(TEAM_NODE[team.type], {
              color: TEAM_STATUS_COLOR[team.status],
              variant: team.status === "available" ? "outline" : "solid",
              shape: "square",
              size: 30,
              selected: suggestedIds.has(team.id),
            })}
            opacity={suggestedIds.size > 0 && !suggestedIds.has(team.id) && team.status === "available" ? 0.55 : 1}
          >
            <Tooltip direction="top" offset={[0, -14]}>
              {pick(team.name)} · {t(`team_${team.status}`)}
            </Tooltip>
          </Marker>
        ))}

        {openCases.map((c) => {
          const sev = effectiveSeverity(c);
          const isSelected = selected?.id === c.id;
          return (
            <Marker
              key={c.id}
              position={c.position}
              icon={pinIcon(HAZARD_NODE[c.triage.hazard], {
                color: SEVERITY_COLOR[sev],
                size: isSelected ? 42 : 34,
                pulse: sev === "critical",
                selected: isSelected,
              })}
              zIndexOffset={isSelected ? 2000 : 1000}
              eventHandlers={{ click: () => onSelect(c.id) }}
            >
              <Tooltip direction="top" offset={[0, -16]}>
                <span className="inline-flex items-center gap-1.5">
                  <SeverityDot severity={sev} />
                  <strong>{pick(HAZARD_LABELS[c.triage.hazard])}</strong>
                </span>
                <div className="max-w-56 truncate text-xs opacity-75">{c.description}</div>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>

      <div className="absolute end-3 top-3 z-[1000] flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => setHeat((h) => !h)}
          aria-pressed={heat}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold shadow-lg transition ${
            heat
              ? "bg-red-600 text-white"
              : "bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200"
          }`}
        >
          <Flame size={14} aria-hidden />
          {t("heatmap")}
        </button>
        {heat && <HeatLegend title={t("heatmap")} low={t("heatLow")} high={t("heatHigh")} />}
      </div>
    </div>
  );
}
