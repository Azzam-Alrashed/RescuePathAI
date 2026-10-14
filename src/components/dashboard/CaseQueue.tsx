"use client";

import {
  CircleCheck,
  Clock,
  Eye,
  Inbox,
  ListChecks,
  MapPin,
  Navigation,
  Sparkles,
  TriangleAlert,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { timeAgo } from "@/components/dashboard/format";
import { HazardTile, VULNERABLE_ICON } from "@/components/icons";
import { SEVERITY_COLOR, SeverityBadge } from "@/components/severity";
import { Chip } from "@/components/ui";
import { byPriority, effectivePriority, effectiveSeverity, isOpen } from "@/lib/dispatch";
import { HAZARD_LABELS, useI18n } from "@/lib/i18n";
import type { CaseStatus, SosCase } from "@/lib/types";

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
  const [filter, setFilter] = useState<"open" | "closed">("open");

  const shown = cases.filter((c) => (filter === "open" ? isOpen(c) : !isOpen(c)));
  shown.sort(filter === "open" ? byPriority : (a, b) => b.updatedAt - a.updatedAt);
  const openCount = cases.filter(isOpen).length;
  const closedCount = cases.length - openCount;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
        <h2 className="text-base font-bold">{t("queue")}</h2>
        <div className="flex rounded-xl bg-slate-200/70 p-0.5 text-xs dark:bg-slate-800" role="tablist">
          {(["open", "closed"] as const).map((f) => (
            <button
              type="button"
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                filter === f
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {f === "open" ? t("filterOpen") : t("filterClosed")}{" "}
              <span className="tabular-nums opacity-60">{formatNumber(f === "open" ? openCount : closedCount)}</span>
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
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <Users size={13} aria-hidden />
                    {formatNumber(c.peopleCount)}
                  </span>
                  {c.shareVulnerable &&
                    (["children", "elderly", "disabled"] as const)
                      .filter((k) => c.vulnerable[k])
                      .map((k) => {
                        const Icon = VULNERABLE_ICON[k];
                        return <Icon key={k} size={13} className="text-sky-600 dark:text-sky-400" aria-label={t(k)} />;
                      })}
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
