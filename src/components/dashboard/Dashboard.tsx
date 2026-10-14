"use client";

import { Languages, LoaderCircle, RotateCcw, Smartphone, TriangleAlert, Users } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { CaseDetail } from "@/components/dashboard/CaseDetail";
import { CaseQueue } from "@/components/dashboard/CaseQueue";
import { HAZARD_ICON } from "@/components/icons";
import { SeverityDot } from "@/components/severity";
import { Button, buttonClass } from "@/components/ui";
import { SCENARIOS } from "@/lib/data/scenarios";
import { byPriority, effectiveSeverity, isOpen, planDispatch } from "@/lib/dispatch";
import { I18nProvider, SEVERITY_LABELS, useI18n } from "@/lib/i18n";
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
  const scenario = SCENARIOS.find((s) => s.id === state.scenarioId);
  const ScenarioIcon = scenario ? HAZARD_ICON[scenario.hazard] : null;
  const available = state.teams.filter((tm) => tm.status === "available").length;
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

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
        {(["critical", "high", "medium", "low"] as const).map((s) => (
          <div
            key={s}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1 dark:border-slate-800"
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
        {scenario && ScenarioIcon && (
          <div className="ms-auto flex items-center gap-2 rounded-xl bg-red-600 px-3 py-1.5 text-sm font-semibold text-white">
            <ScenarioIcon size={15} aria-hidden />
            <span className="text-xs font-normal opacity-80">{t("activeScenario")}:</span>
            {pick(scenario.name)}
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
