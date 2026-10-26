"use client";

import {
  ArrowLeft,
  BellRing,
  ChartColumn,
  Inbox,
  Languages,
  List,
  LoaderCircle,
  Map as MapIcon,
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
import { MapSkeleton } from "@/components/map/MapSkeleton";
import { useFreshMapKey } from "@/components/map/MapView";
import { Menu } from "@/components/Menu";
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
  loading: () => <MapSkeleton />,
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
  // Phones show one pane at a time: the queue or the map, with the case detail opening over them.
  const [mobileView, setMobileView] = useState<"queue" | "map">("queue");
  const [detailOpen, setDetailOpen] = useState(false);

  const plan = useMemo(
    () => (state ? planDispatch(state.cases, state.teams) : new Map<string, TeamOption[]>()),
    [state],
  );
  const [alertCase, dismissAlert] = useCriticalAlert(state);
  const mapKey = useFreshMapKey();

  if (!state) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-brand-navy text-slate-300">
        <BrandMark />
        <LoaderCircle size={20} className="animate-spin" aria-label={t("loading")} />
      </div>
    );
  }

  const select = (id: string) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  const openCases = state.cases.filter(isOpen);
  // Default to the most urgent open case.
  const selected = state.cases.find((c) => c.id === selectedId) ?? [...openCases].sort(byPriority)[0] ?? null;
  const activeScenarios = SCENARIOS.filter((s) => state.scenarioIds.includes(s.id));
  const available = state.teams.filter((tm) => tm.status === "available").length;
  const busy = state.teams.length - available;
  const bySeverity = (s: Severity) => openCases.filter((c) => effectiveSeverity(c) === s).length;
  const toggleLocale = () => setLocale(locale === "ar" ? "en" : "ar");

  return (
    <div className="flex h-svh flex-col bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="flex items-center gap-3 bg-brand-navy px-4 pt-[max(0.625rem,env(safe-area-inset-top))] pb-2.5 text-white">
        <BrandMark />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg leading-tight font-bold">
            <span className="hidden sm:inline">
              {t("appName")} <span className="font-normal text-slate-400">/</span>{" "}
            </span>
            {t("opsTitle")}
          </h1>
          <p className="flex items-center gap-1.5 truncate text-xs text-slate-300/80" role="status">
            <span className="relative flex h-2 w-2 shrink-0">
              {connected && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              )}
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${connected ? "bg-emerald-400" : "bg-red-400"}`}
              />
            </span>
            <span className={connected ? "text-emerald-300" : "text-red-300"}>
              {connected ? t("live") : t("connectionLost")}
            </span>
            <span className="hidden truncate sm:inline">· {t("prototypeBadge")}</span>
          </p>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/dashboard/reports" className={buttonClass("header", "sm")}>
            <ChartColumn size={14} aria-hidden />
            {t("reportsPage")}
          </Link>
          <Button variant="header" size="sm" icon={RotateCcw} onClick={reset}>
            {t("resetDemo")}
          </Button>
          <Link href="/" className={buttonClass("header", "sm")}>
            <Smartphone size={14} aria-hidden />
            {t("residentLink")}
          </Link>
          <Button variant="header" size="sm" icon={Languages} onClick={toggleLocale}>
            {t("switchLang")}
          </Button>
        </div>
        <button
          type="button"
          onClick={toggleLocale}
          aria-label={t("switchLang")}
          className={`${buttonClass("header", "md")} px-3 md:hidden`}
        >
          <Languages size={15} aria-hidden />
          {t("switchLangShort")}
        </button>
        <Menu
          label={t("moreActions")}
          className="md:hidden"
          items={[
            { label: t("reportsPage"), icon: ChartColumn, href: "/dashboard/reports" },
            { label: t("residentLink"), icon: Smartphone, href: "/" },
            { label: t("resetDemo"), icon: RotateCcw, onSelect: reset },
          ]}
        />
      </header>

      {alertCase && (
        <div
          role="alert"
          className="flex items-center gap-3 bg-red-600 px-4 py-2.5 text-white shadow-lg shadow-red-600/30"
        >
          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15">
            <span className="absolute inset-0 animate-ping rounded-full bg-white/30" />
            <BellRing size={17} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm leading-tight font-bold">{t("criticalAlertTitle")}</div>
            <div className="truncate text-xs opacity-90">
              {pick(HAZARD_LABELS[alertCase.triage.hazard])} · <span dir="auto">{alertCase.description}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              select(alertCase.id);
              dismissAlert();
            }}
            className="h-10 shrink-0 rounded-lg bg-white px-3 text-xs font-bold text-red-700 transition hover:bg-red-50 md:h-8"
          >
            {t("viewCase")}
          </button>
          <button
            type="button"
            onClick={dismissAlert}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition hover:bg-white/15 md:h-8 md:w-8"
            aria-label={t("dismiss")}
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      )}

      {/* One swipeable row on phones, wrapping on wider screens. Critical first. */}
      <div className="rpa-no-scrollbar flex items-center gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 sm:flex-wrap dark:border-slate-800 dark:bg-slate-900">
        {(["critical", "high", "medium", "low"] as const).map((s) => (
          <Stat
            key={s}
            highlight={s === "critical" && bySeverity(s) > 0}
            icon={<SeverityDot severity={s} className="h-2.5 w-2.5" />}
            value={formatNumber(bySeverity(s))}
            label={pick(SEVERITY_LABELS[s])}
          />
        ))}
        <Stat
          icon={<Inbox size={15} className="text-slate-500" aria-hidden />}
          value={formatNumber(state.cases.length)}
          label={t("totalReports")}
        />
        <Stat
          icon={<Users size={15} className="text-emerald-600 dark:text-emerald-400" aria-hidden />}
          value={
            <>
              {formatNumber(available)}
              <span className="text-sm font-normal text-slate-400">/{formatNumber(state.teams.length)}</span>
            </>
          }
          label={t("teamsAvailable")}
        />
        <Stat
          icon={<Users size={15} className="text-amber-600 dark:text-amber-400" aria-hidden />}
          value={formatNumber(busy)}
          label={t("teamsBusy")}
        />
        {activeScenarios.length > 0 && (
          <div className="flex shrink-0 items-center gap-1.5 sm:ms-auto sm:flex-wrap">
            <span className="text-xs whitespace-nowrap text-slate-500">{t("activeScenario")}:</span>
            {activeScenarios.map((sc) => {
              const Icon = HAZARD_ICON[sc.hazard];
              return (
                <span
                  key={sc.id}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl bg-red-600 px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-white"
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

      <div
        className="flex gap-1 border-b border-slate-200 bg-white p-2 lg:hidden dark:border-slate-800 dark:bg-slate-900"
        role="tablist"
      >
        {(
          [
            ["queue", List, t("viewQueue"), openCases.length],
            ["map", MapIcon, t("viewMap"), null],
          ] as const
        ).map(([view, Icon, label, count]) => (
          <button
            key={view}
            type="button"
            role="tab"
            aria-selected={mobileView === view}
            onClick={() => setMobileView(view)}
            className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition ${
              mobileView === view
                ? "bg-brand-navy text-white dark:bg-white dark:text-brand-navy"
                : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <Icon size={16} aria-hidden />
            {label}
            {count !== null && <span className="tabular-nums opacity-70">{formatNumber(count)}</span>}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[360px_minmax(0,1fr)_420px]">
        <aside
          className={`${mobileView === "queue" ? "block" : "hidden"} min-h-0 flex-1 border-slate-200 bg-slate-50 lg:block lg:border-e dark:border-slate-800 dark:bg-slate-950`}
        >
          <CaseQueue cases={state.cases} selectedId={selected?.id ?? null} onSelect={select} now={now} />
        </aside>

        <main className={`${mobileView === "map" ? "block" : "hidden"} relative min-h-0 flex-1 lg:block`}>
          <OpsMap key={mapKey} state={state} plan={plan} selected={selected} onSelect={select} />
        </main>

        {/* Phones: a full-screen view over the queue/map with a back button. */}
        <aside
          className={`${detailOpen ? "fixed inset-0 z-[1200] flex" : "hidden"} flex-col bg-slate-50 lg:static lg:z-auto lg:flex lg:min-h-0 lg:border-s lg:border-slate-200 dark:bg-slate-950 dark:lg:border-slate-800`}
        >
          <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 lg:hidden dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setDetailOpen(false)}
              className="flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft size={18} className="rtl:-scale-x-100" aria-hidden />
              {t("back")}
            </button>
            <span className="truncate text-sm text-slate-500">{t("reportDetails")}</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
            {selected ? (
              <CaseDetail
                key={selected.id}
                sosCase={selected}
                cases={state.cases}
                teams={state.teams}
                suggestions={plan.get(selected.id)}
                now={now}
                onAction={(a) => act(selected.id, a)}
                onSelect={select}
              />
            ) : (
              <p className="p-8 text-center text-sm text-slate-500">{t("selectCase")}</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
  highlight,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-1 ${
        highlight
          ? "border-red-300 bg-red-50 dark:border-red-500/40 dark:bg-red-500/10"
          : "border-slate-200 dark:border-slate-800"
      }`}
    >
      {icon}
      <span className="text-base font-bold tabular-nums">{value}</span>
      <span className="text-xs whitespace-nowrap text-slate-500 dark:text-slate-400">{label}</span>
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
