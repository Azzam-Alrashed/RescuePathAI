"use client";

import { useState } from "react";
import { timeAgo } from "@/components/dashboard/format";
import { SEVERITY_COLOR, SeverityBadge } from "@/components/severity";
import { byPriority, effectivePriority, effectiveSeverity, isOpen } from "@/lib/dispatch";
import { HAZARD_ICONS, HAZARD_LABELS, useI18n } from "@/lib/i18n";
import type { CaseStatus, SosCase } from "@/lib/types";

export const CASE_STATUS_STYLE: Record<CaseStatus, string> = {
  new: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  reviewed: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-300",
  assigned: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-300",
  on_scene: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300",
  resolved: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

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

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <h2 className="font-bold">{t("queue")}</h2>
        <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs dark:bg-slate-800" role="tablist">
          {(["open", "closed"] as const).map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1 font-semibold ${
                filter === f ? "bg-white shadow-sm dark:bg-slate-950" : "text-slate-500"
              }`}
            >
              {f === "open" ? `${t("filterOpen")} (${formatNumber(openCount)})` : t("filterClosed")}
            </button>
          ))}
        </div>
      </div>

      <ol className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {shown.length === 0 && <li className="py-8 text-center text-sm text-slate-500">{t("queueEmpty")}</li>}
        {shown.map((c) => {
          const sev = effectiveSeverity(c);
          const v = c.vulnerable;
          return (
            <li key={c.id}>
              <button
                onClick={() => onSelect(c.id)}
                aria-current={selectedId === c.id}
                className={`w-full rounded-xl border border-s-4 p-3 text-start transition ${
                  selectedId === c.id
                    ? "border-slate-900 bg-slate-50 dark:border-white dark:bg-slate-800"
                    : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/60"
                }`}
                style={{ borderInlineStartColor: SEVERITY_COLOR[sev] }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold">
                    {HAZARD_ICONS[c.triage.hazard]} {pick(HAZARD_LABELS[c.triage.hazard])}
                  </span>
                  <span className="text-lg font-bold tabular-nums" title={t("priority")}>
                    {formatNumber(effectivePriority(c))}
                  </span>
                </div>
                <p dir="auto" className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                  {c.description}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                  <SeverityBadge severity={sev} />
                  <span className={`rounded-full px-2 py-0.5 font-medium ${CASE_STATUS_STYLE[c.status]}`}>
                    {c.status === "new" ? `⚠️ ${t("needsReview")}` : t(`case_${c.status}`)}
                  </span>
                  <span className="text-slate-500">
                    👥 {formatNumber(c.peopleCount)}
                    {c.shareVulnerable && (
                      <>
                        {v.children && " 👶"}
                        {v.elderly && " 🧓"}
                        {v.disabled && " ♿"}
                      </>
                    )}
                  </span>
                  <span className="ms-auto text-slate-400">
                    {c.triage.source === "ai" ? "🤖 " : "⚙️ "}
                    {now ? timeAgo(c.createdAt, now, locale) : ""}
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
