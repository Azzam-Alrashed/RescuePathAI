"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createPersistentStore, useBrowserOnline } from "@/lib/browser-store";
import { SCENARIOS } from "@/lib/data/scenarios";
import { isInZone } from "@/lib/geo";
import type { LatLng, Scenario, SosInput, SosReport, TriageResult } from "@/lib/types";

/** Default demo position: Al Olaya, central Riyadh. */
export const DEFAULT_POSITION: LatLng = [24.705, 46.675];

interface AppState {
  scenario: Scenario | null;
  startScenario: (id: string) => void;
  stopScenario: () => void;

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
const reportsStore = createPersistentStore<SosReport[]>("rpa.reports", [], (raw) =>
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
    const input: SosInput = {
      hazard: report.hazard,
      description: report.description,
      peopleCount: report.peopleCount,
      // Vulnerability details only leave the device with consent.
      vulnerable: report.shareVulnerable ? report.vulnerable : { children: false, elderly: false, disabled: false },
      shareVulnerable: report.shareVulnerable,
      position: report.position,
    };
    const res = await fetch("/api/triage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const triage = (await res.json()) as TriageResult;
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
const clearReports = () => reportsStore.set([]);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [scenario, setScenario] = useState<Scenario | null>(null);
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

  const startScenario = useCallback((id: string) => {
    setScenario(SCENARIOS.find((s) => s.id === id) ?? null);
    setFocusKey((k) => k + 1);
  }, []);

  const value = useMemo<AppState>(
    () => ({
      scenario,
      startScenario,
      stopScenario: () => setScenario(null),
      userPos,
      setUserPos,
      inZone: scenario ? isInZone(userPos, scenario.zone) : false,
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
    [scenario, startScenario, userPos, offline, simulatedOffline, reports, focusKey],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}
