"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { CaseDetail } from "@/components/dashboard/CaseDetail";
import { CaseQueue } from "@/components/dashboard/CaseQueue";
import { SEVERITY_STYLE } from "@/components/severity";
import { SCENARIOS } from "@/lib/data/scenarios";
import { byPriority, effectiveSeverity, isOpen, planDispatch } from "@/lib/dispatch";
import { HAZARD_ICONS, I18nProvider, useI18n } from "@/lib/i18n";
import type { Severity } from "@/lib/types";
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

  const plan = useMemo(() => (state ? planDispatch(state.cases, state.teams) : new Map()), [state]);

  if (!state) {
    return <div className="flex h-dvh items-center justify-center text-slate-500">…</div>;
  }

  const openCases = state.cases.filter(isOpen);
  // Default to the most urgent open case.
  const selected =
    state.cases.find((c) => c.id === selectedId) ?? [...openCases].sort(byPriority)[0] ?? null;
  const scenario = SCENARIOS.find((s) => s.id === state.scenarioId);
  const available = state.teams.filter((tm) => tm.status === "available").length;
  const bySeverity = (s: Severity) => openCases.filter((c) => effectiveSeverity(c) === s).length;

  return (
    <div className="flex h-dvh flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-brand-navy px-4 py-2.5 text-white">
        <div className="flex items-center gap-3">
          <BrandMark />
          <div>
            <h1 className="text-lg font-bold leading-tight">
              {t("appName")} · {t("opsTitle")}
            </h1>
            <p className="text-xs text-slate-400">{t("prototypeBadge")}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {(["critical", "high", "medium", "low"] as const).map((s) => (
            <span key={s} className="rounded-full bg-white/10 px-2.5 py-1 tabular-nums">
              {SEVERITY_STYLE[s].dot} {formatNumber(bySeverity(s))}
            </span>
          ))}
          <span className="rounded-full bg-white/10 px-2.5 py-1">
            {t("teamsAvailable")}: {formatNumber(available)}/{formatNumber(state.teams.length)}
          </span>
          {scenario && (
            <span className="rounded-full bg-red-600 px-2.5 py-1 font-semibold">
              {HAZARD_ICONS[scenario.hazard]} {pick(scenario.name)}
            </span>
          )}
        </div>

        <div className="ms-auto flex items-center gap-2 text-sm">
          <span className={`flex items-center gap-1.5 text-xs ${connected ? "text-green-400" : "text-red-400"}`}>
            <span className={`h-2 w-2 rounded-full ${connected ? "animate-pulse bg-green-400" : "bg-red-400"}`} />
            {connected ? t("live") : t("connectionLost")}
          </span>
          <button onClick={reset} className="rounded-lg border border-white/20 px-3 py-1.5 hover:bg-white/10">
            ↺ {t("resetDemo")}
          </button>
          <Link href="/" className="rounded-lg border border-white/20 px-3 py-1.5 hover:bg-white/10">
            {t("residentLink")}
          </Link>
          <button
            onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
            className="rounded-lg border border-white/20 px-3 py-1.5 hover:bg-white/10"
          >
            {t("switchLang")}
          </button>
        </div>
      </header>

      {error && (
        <p role="alert" className="bg-red-100 px-4 py-1.5 text-center text-sm text-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:grid lg:grid-cols-[340px_minmax(0,1fr)_400px] lg:overflow-hidden">
        <aside className="order-2 border-slate-200 lg:order-1 lg:min-h-0 lg:border-e dark:border-slate-800">
          <CaseQueue cases={state.cases} selectedId={selected?.id ?? null} onSelect={setSelectedId} now={now} />
        </aside>

        <main className="relative order-1 h-[45dvh] shrink-0 lg:order-2 lg:h-auto">
          <OpsMap state={state} plan={plan} selected={selected} onSelect={setSelectedId} />
        </main>

        <aside className="order-3 border-slate-200 lg:min-h-0 lg:overflow-y-auto lg:border-s dark:border-slate-800">
          {selected ? (
            <CaseDetail
              key={selected.id}
              sosCase={selected}
              teams={state.teams}
              suggestion={plan.get(selected.id)}
              now={now}
              onAction={(a) => act(selected.id, a)}
            />
          ) : (
            <p className="p-8 text-center text-sm text-slate-500">{t("selectCase")}</p>
          )}
        </aside>
      </div>
    </div>
  );
}
