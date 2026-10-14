"use client";

import { HAZARD_ICONS, HAZARD_LABELS, SEVERITY_LABELS, TEAM_LABELS, useI18n } from "@/lib/i18n";
import { useAppState } from "@/lib/store";
import type { Severity, SosStatus } from "@/lib/types";

export const SEVERITY_STYLE: Record<Severity, { dot: string; badge: string }> = {
  low: { dot: "🟢", badge: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" },
  medium: { dot: "🟡", badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300" },
  high: { dot: "🟠", badge: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300" },
  critical: { dot: "🔴", badge: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" },
};

const STATUS_STYLE: Record<SosStatus, string> = {
  queued: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  sending: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-300",
  received: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-300",
  failed: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-300",
};

export function ReportsList() {
  const { t, pick, locale, statusLabel, formatNumber } = useI18n();
  const { reports, retryReport, clearReports } = useAppState();

  if (reports.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">{t("reportsEmpty")}</p>;
  }

  const timeFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", { timeStyle: "short" });

  return (
    <div className="space-y-3">
      {reports.map((r) => (
        <article key={r.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
          <header className="flex items-center justify-between gap-2">
            <span className="font-semibold">
              {r.hazard === "unknown" ? "❓" : HAZARD_ICONS[r.hazard]}{" "}
              {r.hazard === "unknown" ? t("sosUnknown") : pick(HAZARD_LABELS[r.hazard])}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[r.status]}`}>
              {r.status === "sending" && <span className="me-1 inline-block animate-spin">⟳</span>}
              {statusLabel(r.status)}
            </span>
          </header>
          {r.description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{r.description}</p>}
          <p className="mt-1 text-xs text-slate-400">{timeFmt.format(r.createdAt)}</p>

          {r.status === "failed" && (
            <button onClick={() => retryReport(r.id)} className="mt-2 text-sm font-semibold text-red-600 underline">
              {t("retry")}
            </button>
          )}

          {r.triage && (
            <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold">{t("aiAssessment")}</span>
                <span className="text-xs text-slate-500">
                  {r.triage.source === "ai" ? `🤖 ${t("sourceAi")}` : `⚙️ ${t("sourceRules")}`}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${SEVERITY_STYLE[r.triage.severity].badge}`}>
                  {SEVERITY_STYLE[r.triage.severity].dot} {pick(SEVERITY_LABELS[r.triage.severity])}
                </span>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs dark:bg-slate-700">
                  {HAZARD_ICONS[r.triage.hazard]} {pick(HAZARD_LABELS[r.triage.hazard])}
                </span>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs dark:bg-slate-700">
                  {t("priority")}: {formatNumber(r.triage.priority)}/{formatNumber(100)}
                </span>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs dark:bg-slate-700">
                  {t("suggestedTeam")}: {pick(TEAM_LABELS[r.triage.team])}
                </span>
              </div>
              <p className="mt-2">{pick(r.triage.reasoning)}</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t("humanReview")}</p>
            </div>
          )}
        </article>
      ))}
      <button onClick={clearReports} className="w-full text-center text-xs text-slate-400 underline">
        {t("clearReports")}
      </button>
    </div>
  );
}
