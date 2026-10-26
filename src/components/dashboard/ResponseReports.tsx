"use client";

import {
  ArrowLeft,
  CircleCheck,
  Inbox,
  Info,
  Languages,
  LoaderCircle,
  Siren,
  Timer,
  TriangleAlert,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { HAZARD_ICON, TEAM_ICON } from "@/components/icons";
import { SEVERITY_COLOR } from "@/components/severity";
import { Button, buttonClass, Card, SectionTitle } from "@/components/ui";
import { totalAffected } from "@/lib/affected";
import { effectiveSeverity, isOpen } from "@/lib/dispatch";
import { HAZARD_LABELS, I18nProvider, SEVERITY_LABELS, TEAM_LABELS, useI18n } from "@/lib/i18n";
import type { CaseOutcome, HazardType, ResponseTeam, Severity, SosCase } from "@/lib/types";
import { useOpsState } from "@/lib/use-ops-state";

const HAZARDS: HazardType[] = ["flood", "fire", "missile", "road", "trapped"];
const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];
const OUTCOMES: CaseOutcome[] = ["rescued", "transferred", "false_alarm", "merged"];
const OUTCOME_COLOR: Record<CaseOutcome, string> = {
  rescued: "#059669",
  transferred: "#2563eb",
  false_alarm: "#94a3b8",
  merged: "#a855f7",
};

export function ResponseReports() {
  return (
    <I18nProvider>
      <ReportsShell />
    </I18nProvider>
  );
}

/** Average minutes between two timestamps over the cases that have both. */
function avgMinutes(
  cases: SosCase[],
  from: (c: SosCase) => number | undefined,
  to: (c: SosCase) => number | undefined,
) {
  const spans = cases.flatMap((c) => {
    const a = from(c);
    const b = to(c);
    return a !== undefined && b !== undefined && b >= a ? [(b - a) / 60_000] : [];
  });
  return spans.length ? spans.reduce((s, x) => s + x, 0) / spans.length : null;
}

function ReportsShell() {
  const { t, pick, locale, setLocale, formatNumber } = useI18n();
  const { state } = useOpsState();

  if (!state) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-brand-navy text-slate-300">
        <BrandMark />
        <LoaderCircle size={20} className="animate-spin" aria-label={t("loading")} />
      </div>
    );
  }

  const cases = state.cases;
  const handled = cases.filter((c) => !isOpen(c));
  const open = cases.filter(isOpen);
  const critical = open.filter((c) => effectiveSeverity(c) === "critical").length;
  const rescuedPeople = handled
    .filter((c) => c.outcome === "rescued" || c.outcome === "transferred")
    .reduce((sum, c) => sum + Math.max(1, totalAffected(c.affected)), 0);

  const times = [
    {
      label: t("avgDispatch"),
      value: avgMinutes(
        cases,
        (c) => c.createdAt,
        (c) => c.assignedAt,
      ),
    },
    {
      label: t("avgArrival"),
      value: avgMinutes(
        cases,
        (c) => c.assignedAt,
        (c) => c.onSceneAt,
      ),
    },
    {
      label: t("avgResolve"),
      value: avgMinutes(
        cases,
        (c) => c.createdAt,
        (c) => c.resolvedAt,
      ),
    },
  ];
  const maxTime = Math.max(1, ...times.map((x) => x.value ?? 0));

  const byHazard = HAZARDS.map((h) => ({ h, n: cases.filter((c) => c.triage.hazard === h).length }));
  const maxHazard = Math.max(1, ...byHazard.map((x) => x.n));
  const bySeverity = SEVERITIES.map((s) => ({ s, n: open.filter((c) => effectiveSeverity(c) === s).length }));
  const maxSeverity = Math.max(1, ...bySeverity.map((x) => x.n));
  const outcomes = OUTCOMES.map((o) => ({ o, n: handled.filter((c) => c.outcome === o).length }));

  const teamTypes = [...new Set(state.teams.map((tm) => tm.type))] as ResponseTeam[];

  return (
    <div className="min-h-dvh bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="flex flex-wrap items-center gap-3 bg-brand-navy px-4 py-2.5 text-white">
        <BrandMark />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg leading-tight font-bold">
            {t("appName")} <span className="font-normal text-slate-400">/</span> {t("reportsPage")}
          </h1>
          <p className="truncate text-xs text-slate-300/80">{t("prototypeBadge")}</p>
        </div>
        <Link href="/dashboard" className={buttonClass("header", "sm")}>
          <ArrowLeft size={14} className="rtl:-scale-x-100" aria-hidden />
          <span className="hidden sm:inline">{t("backToOps")}</span>
        </Link>
        <Button variant="header" size="sm" icon={Languages} onClick={() => setLocale(locale === "ar" ? "en" : "ar")}>
          {t("switchLang")}
        </Button>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Kpi icon={Inbox} label={t("totalReports")} value={formatNumber(cases.length)} />
          <Kpi
            icon={CircleCheck}
            label={t("kpiHandled")}
            value={formatNumber(handled.length)}
            tone="text-emerald-600"
          />
          <Kpi icon={Siren} label={t("kpiOpen")} value={formatNumber(open.length)} tone="text-amber-600" />
          <Kpi icon={TriangleAlert} label={t("kpiCritical")} value={formatNumber(critical)} tone="text-red-600" />
          <Kpi icon={Users} label={t("kpiPeople")} value={formatNumber(rescuedPeople)} tone="text-sky-600" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <SectionTitle icon={Timer}>{t("responseTimes")}</SectionTitle>
            <ul className="space-y-3">
              {times.map((x) => (
                <li key={x.label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{x.label}</span>
                    <span className="font-bold tabular-nums">
                      {x.value === null ? "—" : `${formatNumber(x.value, 1)} ${t("min")}`}
                    </span>
                  </div>
                  <Bar value={x.value ?? 0} max={maxTime} color="#0f2a4a" />
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <SectionTitle icon={CircleCheck}>{t("outcomesTitle")}</SectionTitle>
            <div className="flex h-4 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              {outcomes.map(({ o, n }) =>
                n > 0 ? (
                  <span
                    key={o}
                    style={{ width: `${(n / Math.max(1, handled.length)) * 100}%`, backgroundColor: OUTCOME_COLOR[o] }}
                  />
                ) : null,
              )}
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              {outcomes.map(({ o, n }) => (
                <li key={o} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: OUTCOME_COLOR[o] }} />
                  <span className="flex-1">{t(`outcome_${o}`)}</span>
                  <span className="font-bold tabular-nums">{formatNumber(n)}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <SectionTitle>{t("byHazard")}</SectionTitle>
            <ul className="space-y-2.5">
              {byHazard.map(({ h, n }) => {
                const Icon = HAZARD_ICON[h];
                return (
                  <li key={h} className="flex items-center gap-2.5 text-sm">
                    <Icon size={16} className="shrink-0 text-slate-400" aria-hidden />
                    <span className="w-28 shrink-0 truncate">{pick(HAZARD_LABELS[h])}</span>
                    <Bar value={n} max={maxHazard} color="#475569" />
                    <span className="w-6 text-end font-bold tabular-nums">{formatNumber(n)}</span>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <SectionTitle>{t("bySeverity")}</SectionTitle>
            <ul className="space-y-2.5">
              {bySeverity.map(({ s, n }) => (
                <li key={s} className="flex items-center gap-2.5 text-sm">
                  <span className="w-20 shrink-0">{pick(SEVERITY_LABELS[s])}</span>
                  <Bar value={n} max={maxSeverity} color={SEVERITY_COLOR[s]} />
                  <span className="w-6 text-end font-bold tabular-nums">{formatNumber(n)}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="md:col-span-2">
            <SectionTitle icon={Users}>{t("teamUtilisation")}</SectionTitle>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {teamTypes.map((type) => {
                const all = state.teams.filter((tm) => tm.type === type);
                const busy = all.filter((tm) => tm.status !== "available").length;
                const Icon = TEAM_ICON[type];
                return (
                  <li key={type} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <Icon size={16} className="text-slate-400" aria-hidden />
                      <span className="flex-1">{pick(TEAM_LABELS[type])}</span>
                      <span className="tabular-nums">
                        {formatNumber(busy)}/{formatNumber(all.length)}
                      </span>
                    </div>
                    <Bar value={busy} max={all.length} color="#d97706" />
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        <p className="flex items-center gap-2 text-xs text-slate-500">
          <Info size={14} aria-hidden />
          {t("reportsNote")}
        </p>
      </main>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  tone = "text-slate-500",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <Card className="p-3">
      <Icon size={18} className={tone} aria-hidden />
      <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
    </Card>
  );
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      <div
        className="h-full rounded-full"
        style={{ width: `${(value / Math.max(1, max)) * 100}%`, backgroundColor: color }}
      />
    </div>
  );
}
