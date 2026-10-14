"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, Tooltip, useMap } from "react-leaflet";
import {
  BaseTiles,
  HAZARD_COLOR,
  HAZARD_NODE,
  pinIcon,
  RIYADH_CENTER,
  TEAM_NODE,
  TEAM_STATUS_COLOR,
  ZoneShape,
} from "@/components/map/shared";
import { SEVERITY_COLOR, SeverityDot } from "@/components/severity";
import { SCENARIOS } from "@/lib/data/scenarios";
import { effectiveSeverity, isOpen, type TeamOption } from "@/lib/dispatch";
import { HAZARD_LABELS, useI18n } from "@/lib/i18n";
import type { OpsState, SosCase } from "@/lib/types";

interface Props {
  state: OpsState;
  plan: Map<string, TeamOption>;
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

export default function OpsMap({ state, plan, selected, onSelect }: Props) {
  const { pick, t } = useI18n();
  const scenario = SCENARIOS.find((s) => s.id === state.scenarioId);
  const openCases = state.cases.filter(isOpen);
  const teamById = useMemo(() => new Map(state.teams.map((tm) => [tm.id, tm])), [state.teams]);
  const suggestion = selected ? plan.get(selected.id) : undefined;

  return (
    <div dir="ltr" className="h-full w-full">
      <MapContainer center={RIYADH_CENTER} zoom={11} className="h-full w-full">
        <BaseTiles />
        <FollowSelection selected={selected} />

        {scenario && <ZoneShape zone={scenario.zone} color={HAZARD_COLOR[scenario.hazard]} />}

        {/* Teams on their way or on scene */}
        {openCases.map((c) => {
          const team = c.teamId ? teamById.get(c.teamId) : undefined;
          if (!team) return null;
          return (
            <Polyline
              key={`route-${c.id}`}
              positions={[team.base, c.position]}
              pathOptions={{ color: TEAM_STATUS_COLOR[team.status], weight: 3, opacity: 0.85 }}
            />
          );
        })}

        {/* Suggested (not yet approved) assignment for the selected case */}
        {selected && suggestion && (
          <Polyline
            positions={[suggestion.team.base, selected.position]}
            pathOptions={{ color: TEAM_STATUS_COLOR.available, weight: 3, dashArray: "6 8" }}
          />
        )}

        {state.teams.map((team) => (
          <Marker
            key={team.id}
            position={team.base}
            icon={pinIcon(TEAM_NODE[team.type], {
              color: TEAM_STATUS_COLOR[team.status],
              variant: team.status === "available" ? "outline" : "solid",
              shape: "square",
              size: 30,
              selected: suggestion?.team.id === team.id,
            })}
            opacity={suggestion && suggestion.team.id !== team.id && team.status === "available" ? 0.55 : 1}
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
    </div>
  );
}
