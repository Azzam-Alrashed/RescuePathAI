"use client";

import {
  Check,
  CircleCheck,
  CircleX,
  ClipboardList,
  Clock,
  ListChecks,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { HazardTile, TEAM_ICON } from "@/components/icons";
import { SeverityBadge } from "@/components/severity";
import { Button, Card, Chip } from "@/components/ui";
import { HAZARD_LABELS, TEAM_LABELS, useI18n } from "@/lib/i18n";
import { useAppState } from "@/lib/store";
import type { CaseStatus, ResponseUpdate, SosStatus } from "@/lib/types";

const STATUS_CHIP: Record<SosStatus, { tone: "amber" | "sky" | "green" | "red"; icon: LucideIcon }> = {
  queued: { tone: "amber", icon: Clock },
  sending: { tone: "sky", icon: LoaderCircle },
  received: { tone: "green", icon: CircleCheck },
  failed: { tone: "red", icon: CircleX },
};

const STEPS: CaseStatus[] = ["new", "reviewed", "assigned", "on_scene", "resolved"];

export function ReportsList() {
  const { t, pick, locale, statusLabel, formatNumber } = useI18n();
  const { reports, retryReport, clearReports } = useAppState();

  if (reports.length === 0) {
    return (
      <Card className="py-10 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
          <ClipboardList size={26} aria-hidden />
        </span>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{t("reportsEmpty")}</p>
      </Card>
    );
  }

  const timeFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", { timeStyle: "short" });

  return (
    <div className="space-y-3">
      {reports.map((r) => {
        const chip = STATUS_CHIP[r.status];
        const hazard = r.triage?.hazard ?? r.hazard;
        return (
          <Card key={r.id}>
            <header className="flex items-start gap-3">
              <HazardTile hazard={hazard} />
              <div className="min-w-0 flex-1">
                <div className="font-bold">{hazard === "unknown" ? t("sosUnknown") : pick(HAZARD_LABELS[hazard])}</div>
                <div className="text-xs text-slate-400">{timeFmt.format(r.createdAt)}</div>
              </div>
              <Chip tone={chip.tone} icon={chip.icon} spin={r.status === "sending"}>
                {statusLabel(r.status)}
              </Chip>
            </header>

            {r.description && (
              <p dir="auto" className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                {r.description}
              </p>
            )}

            {r.status === "failed" && (
              <Button size="sm" icon={RotateCcw} onClick={() => retryReport(r.id)} className="mt-3">
                {t("retry")}
              </Button>
            )}

            {r.response && <ResponseTracker response={r.response} />}

            {r.triage && (
              <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-semibold">{t("aiAssessment")}</span>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    {r.triage.source === "ai" ? (
                      <Sparkles size={13} aria-hidden />
                    ) : (
                      <ListChecks size={13} aria-hidden />
                    )}
                    {r.triage.source === "ai" ? t("sourceAi") : t("sourceRules")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <SeverityBadge severity={r.triage.severity} />
                  <Chip>
                    {t("priority")} {formatNumber(r.triage.priority)}
                  </Chip>
                  <Chip icon={TEAM_ICON[r.triage.team]}>{pick(TEAM_LABELS[r.triage.team])}</Chip>
                </div>
                <p className="mt-2 text-slate-700 dark:text-slate-300">{pick(r.triage.reasoning)}</p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t("humanReview")}</p>
              </div>
            )}
          </Card>
        );
      })}
      <button
        type="button"
        onClick={clearReports}
        className="mx-auto flex items-center gap-1.5 py-2 text-xs text-slate-400 transition hover:text-red-600"
      >
        <Trash2 size={13} aria-hidden />
        {t("clearReports")}
      </button>
    </div>
  );
}

/** Where the operations centre is with this report, as a five-step tracker. */
function ResponseTracker({ response }: { response: ResponseUpdate }) {
  const { t, pick, formatNumber } = useI18n();
  const current = STEPS.indexOf(response.status);
  const active = response.status === "assigned" || response.status === "on_scene";
  const TeamIcon = response.team ? TEAM_ICON[response.team.type] : null;
  const done = active ? "bg-emerald-600" : "bg-sky-600";

  return (
    <div
      className={`mt-3 rounded-xl p-3 ${
        active
          ? "bg-emerald-50 text-emerald-950 dark:bg-emerald-500/10 dark:text-emerald-100"
          : "bg-sky-50 text-sky-950 dark:bg-sky-500/10 dark:text-sky-100"
      }`}
    >
      <ol className="flex items-center" aria-label={t(`resp_${response.status}`)}>
        {STEPS.map((step, i) => (
          <li key={step} className="flex flex-1 items-center last:flex-none">
            <span
              title={t(`case_${step}`)}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                i <= current
                  ? `${done} text-white`
                  : "bg-white text-transparent ring-1 ring-slate-300 dark:bg-slate-900 dark:ring-slate-600"
              }`}
            >
              <Check size={12} strokeWidth={3} aria-hidden />
            </span>
            {i < STEPS.length - 1 && (
              <span className={`mx-1 h-0.5 flex-1 rounded ${i < current ? done : "bg-slate-300 dark:bg-slate-600"}`} />
            )}
          </li>
        ))}
      </ol>
      <p className="mt-2.5 text-sm font-bold">{t(`resp_${response.status}`)}</p>
      {response.team && TeamIcon && (
        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm">
          <TeamIcon size={15} aria-hidden />
          {pick(response.team.name)}
          {response.status === "assigned" && response.etaS !== undefined && (
            <span className="opacity-75">
              · {t("eta")} ~{formatNumber(Math.max(1, Math.round(response.etaS / 60)))} {t("min")}
            </span>
          )}
        </p>
      )}
    </div>
  );
}
