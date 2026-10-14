"use client";

import {
  Check,
  CheckCheck,
  CircleCheck,
  Clock,
  FileText,
  Info,
  ListChecks,
  MapPin,
  Route,
  Send,
  Smartphone,
  Sparkles,
  Timer,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { CaseStatusChip } from "@/components/dashboard/CaseQueue";
import { etaMinutes, timeAgo } from "@/components/dashboard/format";
import { HazardTile, TEAM_ICON, VULNERABLE_ICON } from "@/components/icons";
import { SEVERITY_BADGE, SeverityBadge, SeverityDot } from "@/components/severity";
import { Button, Card, Chip, SectionTitle } from "@/components/ui";
import { effectivePriority, effectiveSeverity, needsTeam, teamOptions, type TeamOption } from "@/lib/dispatch";
import { HAZARD_LABELS, SEVERITY_LABELS, TEAM_LABELS, useI18n } from "@/lib/i18n";
import type { CaseAction, Severity, SosCase, Team } from "@/lib/types";

const SEVERITIES: Severity[] = ["low", "medium", "high", "critical"];

interface Props {
  sosCase: SosCase;
  teams: Team[];
  suggestion: TeamOption | undefined;
  now: number;
  onAction: (action: CaseAction) => void;
}

export function CaseDetail({ sosCase: c, teams, suggestion, now, onAction }: Props) {
  const { t, pick, locale, formatNumber } = useI18n();
  const sev = effectiveSeverity(c);
  const team = c.teamId ? teams.find((tm) => tm.id === c.teamId) : undefined;
  const vulnerable = c.shareVulnerable
    ? (["children", "elderly", "disabled"] as const).filter((k) => c.vulnerable[k])
    : [];

  return (
    <div className="space-y-3 p-3">
      <Card>
        <div className="flex items-start gap-3">
          <HazardTile hazard={c.triage.hazard} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg leading-tight font-bold">{pick(HAZARD_LABELS[c.triage.hazard])}</h2>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <SeverityBadge severity={sev} />
              <CaseStatusChip status={c.status} />
            </div>
          </div>
          <div className="rounded-xl bg-slate-100 px-3 py-1.5 text-center dark:bg-slate-800">
            <div className="text-2xl leading-none font-bold tabular-nums">{formatNumber(effectivePriority(c))}</div>
            <div className="mt-0.5 text-[10px] font-medium text-slate-500">{t("priority")}</div>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle icon={FileText}>{t("reportDetails")}</SectionTitle>
        <p
          dir="auto"
          className="rounded-xl border-s-4 border-slate-300 bg-slate-50 px-3 py-2 text-sm leading-relaxed dark:border-slate-600 dark:bg-slate-800/60"
        >
          {c.description || "—"}
        </p>
        <dl className="mt-3 space-y-2 text-sm">
          <Meta icon={Users} label={t("people")}>
            {formatNumber(c.peopleCount)}
          </Meta>
          {vulnerable.length > 0 && (
            <Meta icon={VULNERABLE_ICON[vulnerable[0]]} label={t("extraSupport")}>
              <span className="flex flex-wrap justify-end gap-1">
                {vulnerable.map((k) => (
                  <Chip key={k} tone="sky" icon={VULNERABLE_ICON[k]}>
                    {t(k)}
                  </Chip>
                ))}
              </span>
            </Meta>
          )}
          <Meta icon={Clock} label={t("received")}>
            {now ? timeAgo(c.createdAt, now, locale) : ""}
          </Meta>
          <Meta icon={MapPin} label={t("sosLocation")}>
            <span dir="ltr" className="tabular-nums">
              {c.position[0].toFixed(4)}, {c.position[1].toFixed(4)}
            </span>
          </Meta>
          <Meta icon={Smartphone} label={t("origin")}>
            {c.origin === "resident" ? t("origin_resident") : t("origin_demo")}
          </Meta>
        </dl>
      </Card>

      <Card>
        <SectionTitle
          icon={c.triage.source === "ai" ? Sparkles : ListChecks}
          aside={<Chip>{c.triage.source === "ai" ? t("sourceAi") : t("sourceRules")}</Chip>}
        >
          {t("aiAssessment")}
        </SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          <SeverityBadge severity={c.triage.severity} />
          <Chip icon={TEAM_ICON[c.triage.team]}>{pick(TEAM_LABELS[c.triage.team])}</Chip>
        </div>
        <p className="mt-2.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{pick(c.triage.reasoning)}</p>
      </Card>

      <Card>
        <SectionTitle icon={UserCheck}>{t("humanReviewTitle")}</SectionTitle>
        <p className="-mt-1.5 mb-3 text-xs text-slate-500 dark:text-slate-400">{t("reviewHint")}</p>
        <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label={t("humanReviewTitle")}>
          {SEVERITIES.map((s) => (
            <button
              type="button"
              key={s}
              role="radio"
              aria-checked={sev === s}
              disabled={c.status === "resolved"}
              onClick={() => onAction({ action: "review", severity: s })}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-1 py-2 text-xs font-semibold transition disabled:opacity-50 ${
                sev === s
                  ? `${SEVERITY_BADGE[s]} border-current`
                  : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <SeverityDot severity={s} className="h-3 w-3" />
              {pick(SEVERITY_LABELS[s])}
            </button>
          ))}
        </div>
        {c.reviewedSeverity && c.reviewedSeverity !== c.triage.severity && (
          <p className="mt-2 text-xs text-slate-500">
            {t("changedFrom")}: {pick(SEVERITY_LABELS[c.triage.severity])} ({t("sourceAi")})
          </p>
        )}
        {c.status === "new" && (
          <Button
            variant="primary"
            icon={Check}
            onClick={() => onAction({ action: "review", severity: sev })}
            className="mt-3 w-full"
          >
            {t("confirmAssessment")}
          </Button>
        )}
      </Card>

      <Card>
        <SectionTitle icon={Route}>{t("dispatchTitle")}</SectionTitle>

        {needsTeam(c) && <DispatchSuggestion c={c} teams={teams} suggestion={suggestion} onAction={onAction} />}

        {team && (c.status === "assigned" || c.status === "on_scene") && (
          <div className="space-y-3">
            <TeamRow team={team} label={t("assignedTeam")} tone={c.status === "on_scene" ? "blue" : "amber"}>
              {c.status === "assigned" && c.etaS !== undefined && (
                <Chip icon={Timer}>
                  ~{formatNumber(etaMinutes(c.etaS))} {t("min")}
                </Chip>
              )}
            </TeamRow>
            <div className="flex gap-2">
              {c.status === "assigned" && (
                <Button
                  variant="info"
                  icon={MapPin}
                  onClick={() => onAction({ action: "on_scene" })}
                  className="flex-1"
                >
                  {t("markOnScene")}
                </Button>
              )}
              <Button icon={CheckCheck} onClick={() => onAction({ action: "resolve" })} className="flex-1">
                {t("resolveCase")}
              </Button>
            </div>
          </div>
        )}

        {c.status === "resolved" && (
          <p className="flex items-center gap-2 rounded-xl bg-slate-100 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <CircleCheck size={18} className="text-emerald-600" aria-hidden />
            {t("case_resolved")}
          </p>
        )}
      </Card>

      <p className="flex gap-2 px-1 pb-2 text-xs text-slate-500 dark:text-slate-400">
        <Info size={14} className="mt-0.5 shrink-0" aria-hidden />
        {t("dispatchDisclaimer")}
      </p>
    </div>
  );
}

function Meta({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <Icon size={15} aria-hidden />
        {label}
      </dt>
      <dd className="text-end font-medium">{children}</dd>
    </div>
  );
}

const TEAM_TONE = {
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
};

function TeamRow({
  team,
  label,
  tone,
  children,
}: {
  team: Team;
  label: string;
  tone: keyof typeof TEAM_TONE;
  children?: React.ReactNode;
}) {
  const { pick } = useI18n();
  const Icon = TEAM_ICON[team.type];
  return (
    <div className="flex items-center gap-3">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TEAM_TONE[tone]}`}>
        <Icon size={20} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
        <div className="truncate font-semibold">{pick(team.name)}</div>
      </div>
      {children}
    </div>
  );
}

function DispatchSuggestion({
  c,
  teams,
  suggestion,
  onAction,
}: {
  c: SosCase;
  teams: Team[];
  suggestion: TeamOption | undefined;
  onAction: (action: CaseAction) => void;
}) {
  const { t, pick, formatNumber } = useI18n();
  const options = teamOptions(c, teams);

  return (
    <div className="space-y-3">
      {suggestion ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-500/25 dark:bg-emerald-500/5">
          <div className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <Sparkles size={13} aria-hidden />
            {t("suggestedTeam")}
          </div>
          <TeamRow team={suggestion.team} label={pick(TEAM_LABELS[suggestion.team.type])} tone="green" />
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Chip icon={Route}>
              {formatNumber(suggestion.distanceM / 1000, 1)} {t("km")}
            </Chip>
            <Chip icon={Timer}>
              ~{formatNumber(etaMinutes(suggestion.etaS))} {t("min")}
            </Chip>
          </div>
          <p className="mt-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {suggestion.substitute ? t("substituteNote") : t("dispatchReason")}
          </p>
          <Button
            variant="success"
            icon={Send}
            mirrorIcon
            onClick={() => onAction({ action: "assign", teamId: suggestion.team.id })}
            className="mt-3 w-full"
          >
            {t("approveDispatch")}
          </Button>
        </div>
      ) : (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          {t("noTeamAvailable")}
        </p>
      )}

      {options.length > 0 && (
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">{t("otherTeam")}</span>
          <select
            value=""
            onChange={(e) => e.target.value && onAction({ action: "assign", teamId: e.target.value })}
            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">—</option>
            {options.map((o) => (
              <option key={o.team.id} value={o.team.id}>
                {pick(o.team.name)} · ~{formatNumber(etaMinutes(o.etaS))} {t("min")}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
