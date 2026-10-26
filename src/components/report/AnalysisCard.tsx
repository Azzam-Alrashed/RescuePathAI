"use client";

import { FlaskConical, Sparkles } from "lucide-react";
import { HazardTile, TEAM_ICON } from "@/components/icons";
import { SeverityBadge } from "@/components/severity";
import { Chip } from "@/components/ui";
import { HAZARD_LABELS, TEAM_LABELS, useI18n } from "@/lib/i18n";
import type { ImageAnalysis } from "@/lib/types";

/** The result of a photo analysis: hazard, severity, suggested teams and findings. */
export function AnalysisCard({ analysis }: { analysis: ImageAnalysis }) {
  const { t, pick, formatNumber } = useI18n();
  const pct = Math.round(analysis.confidence * 100);

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-3 dark:border-violet-500/30 dark:bg-violet-500/5">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-bold text-violet-700 dark:text-violet-300">
          <Sparkles size={14} aria-hidden />
          {t("photoAnalysisTitle")}
        </span>
        <Chip
          tone={analysis.source === "ai" ? "blue" : "neutral"}
          icon={analysis.source === "ai" ? Sparkles : FlaskConical}
        >
          {analysis.source === "ai" ? t("sourceAi") : t("sourceSimulated")}
        </Chip>
      </div>
      <div className="flex items-center gap-3">
        <HazardTile hazard={analysis.hazard} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="font-bold">{pick(HAZARD_LABELS[analysis.hazard])}</div>
          <div className="mt-1">
            <SeverityBadge severity={analysis.severity} />
          </div>
        </div>
      </div>
      <p className="mt-2.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{pick(analysis.findings)}</p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {analysis.teams.map((team) => (
          <Chip key={team} icon={TEAM_ICON[team]}>
            {pick(TEAM_LABELS[team])}
          </Chip>
        ))}
      </div>
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{t("confidence")}</span>
          <span className="tabular-nums">{formatNumber(pct)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-500/15">
          <div className="h-full rounded-full bg-violet-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
