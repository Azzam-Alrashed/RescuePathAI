"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { shareableAffected } from "@/lib/affected";
import { createPersistentStore, useBrowserOnline } from "@/lib/browser-store";
import { SCENARIOS } from "@/lib/data/scenarios";
import { isInZone } from "@/lib/geo";
import type { LatLng, ResponseUpdate, Scenario, SosInput, SosReport, TriageResult } from "@/lib/types";

/** Default demo position: Al Olaya, central Riyadh. */
export const DEFAULT_POSITION: LatLng = [24.705, 46.675];

interface AppState {
  /** Every active scenario, in the order they started. */
  scenarios: Scenario[];
  /** The scenario that matters most to the resident: the one they are in, else the latest. */
  scenario: Scenario | null;
  toggleScenario: (id: string) => void;
  startAllScenarios: () => void;
  stopAllScenarios: () => void;

  userPos: LatLng;
  setUserPos: (p: LatLng) => void;
  inZone: boolean;

  /** True when the browser is offline or the demo "no internet" switch is on. */
  offline: boolean;
  simulatedOffline: boolean;
  setSimulatedOffline: (v: boolean) => void;

  reports: SosReport[];
  submitSos: (input: SosInput) => SosReport;
  retryReport: (id: string) => void;
  clearReports: () => void;

  /** Bumped when the map should re-centre (scenario start, location jump). */
  focusKey: number;
  requestFocus: () => void;
}

const AppContext = createContext<AppState | null>(null);

// A report left "sending" by a closed tab never got a reply: queue it again.
const reportsStore = createPersistentStore<SosReport[]>("rpa.reports.v2", [], (raw) =>
  (JSON.parse(raw) as SosReport[]).map((r) => (r.status === "sending" ? { ...r, status: "queued" } : r)),
);
const inFlight = new Set<string>();

function updateReport(id: string, patch: Partial<SosReport>) {
  reportsStore.set((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
}

async function sendReport(report: SosReport) {
  if (inFlight.has(report.id)) return;
  inFlight.add(report.id);
  updateReport(report.id, { status: "sending" });
  try {
    const body: SosInput & { id: string } = {
      id: report.id,
      hazard: report.hazard,
      description: report.description,
      // Vulnerability details only leave the device with consent.
      affected: shareableAffected(report.affected, report.shareVulnerable),
      shareVulnerable: report.shareVulnerable,
      position: report.position,
      channel: report.channel,
      photo: report.photo,
      photoAnalysis: report.photoAnalysis,
    };
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { triage } = (await res.json()) as { triage: TriageResult };
    updateReport(report.id, { status: "received", triage });
  } catch {
    updateReport(report.id, { status: navigator.onLine ? "failed" : "queued" });
  } finally {
    inFlight.delete(report.id);
  }
}

/** Saves a report as queued; the provider sends queued reports whenever we're online. */
function submitSos(input: SosInput): SosReport {
  const report: SosReport = { ...input, id: crypto.randomUUID(), createdAt: Date.now(), status: "queued" };
  reportsStore.set((rs) => [report, ...rs]);
  return report;
}

const retryReport = (id: string) => updateReport(id, { status: "queued" });

const RESPONSE_POLL_MS = 5000;

/** Pulls the operations centre's response (team assigned, on scene…) for open reports. */
async function refreshResponses() {
  const ids = reportsStore
    .get()
    .filter((r) => r.status === "received" && r.response?.status !== "resolved")
    .map((r) => r.id);
  if (ids.length === 0) return;
  try {
    const res = await fetch(`/api/reports?ids=${ids.join(",")}`);
    if (!res.ok) return;
    const updates = new Map(((await res.json()) as ResponseUpdate[]).map((u) => [u.id, u]));
    reportsStore.set((rs) => rs.map((r) => (updates.has(r.id) ? { ...r, response: updates.get(r.id) } : r)));
  } catch {}
}

/** Shares the simulated city-wide scenarios with the operations dashboard. */
function shareScenarios(ids: string[]) {
  fetch("/api/ops/scenario", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  }).catch(() => {});
}
const clearReports = () => reportsStore.set([]);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [scenarioIds, setScenarioIds] = useState<string[]>([]);
  const [userPos, setUserPos] = useState<LatLng>(DEFAULT_POSITION);
  const [simulatedOffline, setSimulatedOffline] = useState(false);
  const browserOnline = useBrowserOnline();
  const reports = reportsStore.useValue();
  const [focusKey, setFocusKey] = useState(0);

  const offline = simulatedOffline || !browserOnline;

  // Flush queued reports whenever we're online.
  useEffect(() => {
    if (offline) return;
    reports.filter((r) => r.status === "queued").forEach((r) => void sendReport(r));
  }, [offline, reports]);

  useEffect(() => {
    if (offline) return;
    const timer = setInterval(refreshResponses, RESPONSE_POLL_MS);
    return () => clearInterval(timer);
  }, [offline]);

  const updateScenarios = useCallback((next: string[]) => {
    setScenarioIds(next);
    shareScenarios(next);
    if (next.length > 0) setFocusKey((k) => k + 1);
  }, []);

  const scenarios = useMemo(() => scenarioIds.flatMap((id) => SCENARIOS.filter((s) => s.id === id)), [scenarioIds]);
  const zoneScenario = scenarios.find((s) => isInZone(userPos, s.zone)) ?? null;
  const scenario = zoneScenario ?? scenarios.at(-1) ?? null;

  const value = useMemo<AppState>(
    () => ({
      scenarios,
      scenario,
      toggleScenario: (id: string) =>
        updateScenarios(scenarioIds.includes(id) ? scenarioIds.filter((s) => s !== id) : [...scenarioIds, id]),
      startAllScenarios: () => updateScenarios(SCENARIOS.map((s) => s.id)),
      stopAllScenarios: () => updateScenarios([]),
      userPos,
      setUserPos,
      inZone: !!zoneScenario,
      offline,
      simulatedOffline,
      setSimulatedOffline,
      reports,
      submitSos,
      retryReport,
      clearReports,
      focusKey,
      requestFocus: () => setFocusKey((k) => k + 1),
    }),
    [
      scenarios,
      scenario,
      zoneScenario,
      scenarioIds,
      updateScenarios,
      userPos,
      offline,
      simulatedOffline,
      reports,
      focusKey,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}
