"use client";

import {
  BellRing,
  ChartColumn,
  Inbox,
  Languages,
  LoaderCircle,
  RotateCcw,
  Smartphone,
  TriangleAlert,
  Users,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { CaseDetail } from "@/components/dashboard/CaseDetail";
import { CaseQueue } from "@/components/dashboard/CaseQueue";
import { HAZARD_ICON } from "@/components/icons";
import { SeverityDot } from "@/components/severity";
import { Button, buttonClass } from "@/components/ui";
import { SCENARIOS } from "@/lib/data/scenarios";
import { byPriority, effectiveSeverity, isOpen, planDispatch, type TeamOption } from "@/lib/dispatch";
import { HAZARD_LABELS, I18nProvider, SEVERITY_LABELS, useI18n } from "@/lib/i18n";
import type { OpsState, Severity, SosCase } from "@/lib/types";
import { useOpsState } from "@/lib/use-ops-state";

const OpsMap = dynamic(() => import("./OpsMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-slate-200 dark:bg-slate-800" />,
});

export function Dashboard() {
  return (
    <I18nProvider>
      <DashboardShell />
    </I18nProvider>
  );
}

function DashboardShell() {
  const { t, pick, locale, setLocale, formatNumber } = useI18n();
  const { state, connected, error, now, act, reset } = useOpsState();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const plan = useMemo(
    () => (state ? planDispatch(state.cases, state.teams) : new Map<string, TeamOption[]>()),
    [state],
  );
  const [alertCase, dismissAlert] = useCriticalAlert(state);

  if (!state) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-brand-navy text-slate-300">
        <BrandMark />
        <LoaderCircle size={20} className="animate-spin" aria-label={t("loading")} />
      </div>
    );
  }

  const openCases = state.cases.filter(isOpen);
  // Default to the most urgent open case.
  const selected = state.cases.find((c) => c.id === selectedId) ?? [...openCases].sort(byPriority)[0] ?? null;
  const activeScenarios = SCENARIOS.filter((s) => state.scenarioIds.includes(s.id));
  const available = state.teams.filter((tm) => tm.status === "available").length;
  const busy = state.teams.length - available;
  const bySeverity = (s: Severity) => openCases.filter((c) => effectiveSeverity(c) === s).length;

  return (
    <div className="flex h-dvh flex-col bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-brand-navy px-4 py-2.5 text-white">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <BrandMark />
          <div className="min-w-0">
            <h1 className="truncate text-lg leading-tight font-bold">
              {t("appName")} <span className="font-normal text-slate-400">/</span> {t("opsTitle")}
            </h1>
            <p className="truncate text-xs text-slate-300/80">{t("prototypeBadge")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`me-1 flex items-center gap-1.5 text-xs font-medium ${connected ? "text-emerald-300" : "text-red-300"}`}
            role="status"
          >
            <span className="relative flex h-2 w-2">
              {connected && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              )}
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${connected ? "bg-emerald-400" : "bg-red-400"}`}
              />
            </span>
            {connected ? t("live") : t("connectionLost")}
          </span>
          <Link href="/dashboard/reports" className={buttonClass("header", "sm")} aria-label={t("reportsPage")}>
            <ChartColumn size={14} aria-hidden />
            <span className="hidden sm:inline">{t("reportsPage")}</span>
          </Link>
          <Button variant="header" size="sm" icon={RotateCcw} onClick={reset}>
            <span className="hidden sm:inline">{t("resetDemo")}</span>
          </Button>
          <Link href="/" className={buttonClass("header", "sm")} aria-label={t("residentLink")}>
            <Smartphone size={14} aria-hidden />
            <span className="hidden sm:inline">{t("residentLink")}</span>
          </Link>
          <Button variant="header" size="sm" icon={Languages} onClick={() => setLocale(locale === "ar" ? "en" : "ar")}>
            {t("switchLang")}
          </Button>
        </div>
      </header>

      {alertCase && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 bg-red-600 px-4 py-2.5 text-white shadow-lg shadow-red-600/30"
        >
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
            <span className="absolute inset-0 animate-ping rounded-full bg-white/30" />
            <BellRing size={17} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold">{t("criticalAlertTitle")}</div>
            <div className="truncate text-xs opacity-90">
              {pick(HAZARD_LABELS[alertCase.triage.hazard])} · <span dir="auto">{alertCase.description}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedId(alertCase.id);
              dismissAlert();
            }}
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50"
          >
            {t("viewCase")}
          </button>
          <button
            type="button"
            onClick={dismissAlert}
            className="rounded-lg p-1.5 transition hover:bg-white/15"
            aria-label={t("dismiss")}
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1 dark:border-slate-800">
          <Inbox size={15} className="text-slate-500" aria-hidden />
          <span className="text-base font-bold tabular-nums">{formatNumber(state.cases.length)}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{t("totalReports")}</span>
        </div>
        {(["critical", "high", "medium", "low"] as const).map((s) => (
          <div
            key={s}
            className={`flex items-center gap-2 rounded-xl border px-3 py-1 ${
              s === "critical" && bySeverity(s) > 0
                ? "border-red-300 bg-red-50 dark:border-red-500/40 dark:bg-red-500/10"
                : "border-slate-200 dark:border-slate-800"
            }`}
          >
            <SeverityDot severity={s} className="h-2.5 w-2.5" />
            <span className="text-base font-bold tabular-nums">{formatNumber(bySeverity(s))}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{pick(SEVERITY_LABELS[s])}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1 dark:border-slate-800">
          <Users size={15} className="text-emerald-600 dark:text-emerald-400" aria-hidden />
          <span className="text-base font-bold tabular-nums">
            {formatNumber(available)}
            <span className="text-sm font-normal text-slate-400">/{formatNumber(state.teams.length)}</span>
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{t("teamsAvailable")}</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1 dark:border-slate-800">
          <Users size={15} className="text-amber-600 dark:text-amber-400" aria-hidden />
          <span className="text-base font-bold tabular-nums">{formatNumber(busy)}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{t("teamsBusy")}</span>
        </div>
        {activeScenarios.length > 0 && (
          <div className="ms-auto flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-500">{t("activeScenario")}:</span>
            {activeScenarios.map((sc) => {
              const Icon = HAZARD_ICON[sc.hazard];
              return (
                <span
                  key={sc.id}
                  className="flex items-center gap-1.5 rounded-xl bg-red-600 px-2.5 py-1 text-xs font-semibold text-white"
                >
                  <Icon size={13} aria-hidden />
                  {pick(sc.name)}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-center justify-center gap-2 bg-red-50 px-4 py-1.5 text-sm text-red-900 dark:bg-red-500/10 dark:text-red-200"
        >
          <TriangleAlert size={15} aria-hidden />
          {error}
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:grid lg:grid-cols-[360px_minmax(0,1fr)_420px] lg:overflow-hidden">
        <aside className="order-2 border-slate-200 bg-slate-50 lg:order-1 lg:min-h-0 lg:border-e dark:border-slate-800 dark:bg-slate-950">
          <CaseQueue cases={state.cases} selectedId={selected?.id ?? null} onSelect={setSelectedId} now={now} />
        </aside>

        <main className="relative order-1 h-[45dvh] shrink-0 lg:order-2 lg:h-auto">
          <OpsMap state={state} plan={plan} selected={selected} onSelect={setSelectedId} />
        </main>

        <aside className="order-3 border-slate-200 bg-slate-50 lg:min-h-0 lg:overflow-y-auto lg:border-s dark:border-slate-800 dark:bg-slate-950">
          {selected ? (
            <CaseDetail
              key={selected.id}
              sosCase={selected}
              cases={state.cases}
              teams={state.teams}
              suggestions={plan.get(selected.id)}
              now={now}
              onAction={(a) => act(selected.id, a)}
              onSelect={setSelectedId}
            />
          ) : (
            <p className="p-8 text-center text-sm text-slate-500">{t("selectCase")}</p>
          )}
        </aside>
      </div>
    </div>
  );
}

const ALERT_MS = 15_000;

/** Beeps twice with the Web Audio API; silently does nothing if audio is blocked. */
function beep() {
  try {
    const ctx = new AudioContext();
    [0, 0.25].forEach((at) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, ctx.currentTime + at);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + at + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + at);
      osc.stop(ctx.currentTime + at + 0.2);
    });
  } catch {}
}

/** The newest critical case that arrived since the dashboard opened, until dismissed. */
function useCriticalAlert(state: OpsState | null): [SosCase | null, () => void] {
  const seen = useRef<Set<string> | null>(null);
  const [alertId, setAlertId] = useState<string | null>(null);

  useEffect(() => {
    if (!state) return;
    const ids = state.cases.map((c) => c.id);
    // Everything present on first load is already known.
    if (!seen.current) {
      seen.current = new Set(ids);
      return;
    }
    const fresh = state.cases.filter((c) => !seen.current!.has(c.id));
    fresh.forEach((c) => seen.current!.add(c.id));
    const critical = fresh.filter((c) => isOpen(c) && effectiveSeverity(c) === "critical").sort(byPriority)[0];
    if (critical) {
      setAlertId(critical.id);
      beep();
    }
  }, [state]);

  useEffect(() => {
    if (!alertId) return;
    const timer = setTimeout(() => setAlertId(null), ALERT_MS);
    return () => clearTimeout(timer);
  }, [alertId]);

  const alertCase = (alertId && state?.cases.find((c) => c.id === alertId)) || null;
  return [alertCase, () => setAlertId(null)];
}
