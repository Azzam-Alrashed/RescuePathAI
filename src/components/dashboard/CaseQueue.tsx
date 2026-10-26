"use client";

import {
  Camera,
  CircleCheck,
  Clock,
  Copy,
  Eye,
  Inbox,
  ListChecks,
  MapPin,
  Mic,
  Navigation,
  Siren,
  Sparkles,
  TriangleAlert,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { timeAgo } from "@/components/dashboard/format";
import { AFFECTED_ICON, HazardTile } from "@/components/icons";
import { SEVERITY_COLOR, SeverityBadge } from "@/components/severity";
import { Chip } from "@/components/ui";
import { totalAffected, VULNERABLE_GROUPS } from "@/lib/affected";
import { byPriority, effectivePriority, effectiveSeverity, isOpen } from "@/lib/dispatch";
import { caseStage, HAZARD_LABELS, useI18n, type CaseStage } from "@/lib/i18n";
import type { CaseStatus, ReportChannel, SosCase } from "@/lib/types";

const CHANNEL_ICON: Partial<Record<ReportChannel, LucideIcon>> = { photo: Camera, voice: Mic, sos: Siren };
const STAGES: CaseStage[] = ["new", "responding", "rescued"];

const CASE_STATUS: Record<CaseStatus, { tone: "amber" | "sky" | "orange" | "blue" | "neutral"; icon: LucideIcon }> = {
  new: { tone: "amber", icon: TriangleAlert },
  reviewed: { tone: "sky", icon: Eye },
  assigned: { tone: "orange", icon: Navigation },
  on_scene: { tone: "blue", icon: MapPin },
  resolved: { tone: "neutral", icon: CircleCheck },
};

export function CaseStatusChip({ status }: { status: CaseStatus }) {
  const { t } = useI18n();
  const s = CASE_STATUS[status];
  return (
    <Chip tone={s.tone} icon={s.icon}>
      {status === "new" ? t("needsReview") : t(`case_${status}`)}
    </Chip>
  );
}

interface Props {
  cases: SosCase[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  now: number;
}

export function CaseQueue({ cases, selectedId, onSelect, now }: Props) {
  const { t, pick, locale, formatNumber } = useI18n();
  const [filter, setFilter] = useState<CaseStage>("new");

  const countOf = (stage: CaseStage) => cases.filter((c) => caseStage(c.status) === stage).length;
  const shown = cases.filter((c) => caseStage(c.status) === filter);
  shown.sort(filter === "rescued" ? (a, b) => b.updatedAt - a.updatedAt : byPriority);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
        <h2 className="text-base font-bold">{t("queue")}</h2>
        <div className="flex rounded-xl bg-slate-200/70 p-0.5 text-xs dark:bg-slate-800" role="tablist">
          {STAGES.map((f) => (
            <button
              type="button"
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-2 py-1.5 font-semibold transition ${
                filter === f
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {t(`stage_${f}`)} <span className="tabular-nums opacity-60">{formatNumber(countOf(f))}</span>
            </button>
          ))}
        </div>
      </div>

      <ol className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-3">
        {shown.length === 0 && (
          <li className="flex flex-col items-center gap-2 py-12 text-sm text-slate-400">
            <Inbox size={28} aria-hidden />
            {t("queueEmpty")}
          </li>
        )}
        {shown.map((c) => {
          const sev = effectiveSeverity(c);
          const isSelected = selectedId === c.id;
          const ChannelIcon = CHANNEL_ICON[c.channel];
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                aria-current={isSelected}
                className={`relative w-full overflow-hidden rounded-2xl border bg-white p-3 ps-4 text-start transition dark:bg-slate-900 ${
                  isSelected
                    ? "border-brand-navy shadow-md ring-1 ring-brand-navy dark:border-slate-300 dark:ring-slate-300"
                    : "border-slate-200 shadow-sm hover:border-slate-300 hover:shadow dark:border-slate-800 dark:hover:border-slate-700"
                }`}
              >
                <span
                  aria-hidden
                  className="absolute inset-y-0 start-0 w-1"
                  style={{ backgroundColor: SEVERITY_COLOR[sev] }}
                />
                <div className="flex items-start gap-3">
                  <HazardTile hazard={c.triage.hazard} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="truncate font-bold">{pick(HAZARD_LABELS[c.triage.hazard])}</span>
                      <span
                        className="-mt-0.5 rounded-lg bg-slate-100 px-2 py-0.5 text-sm font-bold tabular-nums dark:bg-slate-800"
                        title={t("priority")}
                      >
                        {formatNumber(effectivePriority(c))}
                      </span>
                    </div>
                    <p dir="auto" className="mt-0.5 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                      {c.description}
                    </p>
                  </div>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <SeverityBadge severity={sev} />
                  <CaseStatusChip status={c.status} />
                  {c.duplicateOf && isOpen(c) && (
                    <Chip tone="orange" icon={Copy}>
                      {t("possibleDuplicate")}
                    </Chip>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <Users size={13} aria-hidden />
                    {formatNumber(Math.max(1, totalAffected(c.affected)))}
                  </span>
                  {[...VULNERABLE_GROUPS, "trapped" as const]
                    .filter((k) => c.affected[k] > 0)
                    .map((k) => {
                      const Icon = AFFECTED_ICON[k];
                      return (
                        <Icon
                          key={k}
                          size={13}
                          className={k === "trapped" ? "text-red-600" : "text-sky-600 dark:text-sky-400"}
                          aria-label={t(`group_${k}`)}
                        />
                      );
                    })}
                  {ChannelIcon && (
                    <ChannelIcon size={13} className="text-violet-600" aria-label={t(`channel_${c.channel}`)} />
                  )}
                  <span className="ms-auto inline-flex items-center gap-3">
                    <span
                      className="inline-flex items-center gap-1"
                      title={c.triage.source === "ai" ? t("sourceAi") : t("sourceRules")}
                    >
                      {c.triage.source === "ai" ? (
                        <Sparkles size={13} aria-hidden />
                      ) : (
                        <ListChecks size={13} aria-hidden />
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={13} aria-hidden />
                      {now ? timeAgo(c.createdAt, now, locale) : ""}
                    </span>
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
