"use client";

import {
  ArrowRight,
  Check,
  CheckCheck,
  CircleCheck,
  ClipboardCopy,
  Clock,
  Copy,
  FileText,
  GitMerge,
  History,
  Info,
  ListChecks,
  MapPin,
  MessageSquare,
  RefreshCw,
  Route,
  Send,
  Smartphone,
  Sparkles,
  Timer,
  UserCheck,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { CaseStatusChip } from "@/components/dashboard/CaseQueue";
import { etaMinutes, timeAgo } from "@/components/dashboard/format";
import { AFFECTED_ICON, HazardTile, TEAM_ICON } from "@/components/icons";
import { AffectedCounter } from "@/components/report/AffectedCounter";
import { AnalysisCard } from "@/components/report/AnalysisCard";
import { SEVERITY_BADGE, SeverityBadge, SeverityDot } from "@/components/severity";
import { Button, Card, Chip, SectionTitle } from "@/components/ui";
import { AFFECTED_GROUPS, totalAffected } from "@/lib/affected";
import {
  anyTeamOptions,
  effectivePriority,
  effectiveSeverity,
  estimateTravel,
  isOpen,
  missingTeams,
  type TeamOption,
} from "@/lib/dispatch";
import { HAZARD_LABELS, SEVERITY_LABELS, TEAM_LABELS, useI18n } from "@/lib/i18n";
import { summarizeCase } from "@/lib/summary";
import type { CaseAction, Severity, SosCase, Team } from "@/lib/types";

const SEVERITIES: Severity[] = ["low", "medium", "high", "critical"];
const OUTCOMES = ["rescued", "transferred", "false_alarm"] as const;

interface Props {
  sosCase: SosCase;
  cases: SosCase[];
  teams: Team[];
  suggestions: TeamOption[] | undefined;
  now: number;
  onAction: (action: CaseAction) => Promise<void> | void;
  onSelect: (id: string) => void;
}

export function CaseDetail({ sosCase: c, cases, teams, suggestions, now, onAction, onSelect }: Props) {
  const { t, pick, locale, formatNumber } = useI18n();
  const sev = effectiveSeverity(c);
  const original = c.duplicateOf ? cases.find((o) => o.id === c.duplicateOf) : undefined;
  const open = isOpen(c);

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
              {c.outcome && <Chip tone="green">{t(`outcome_${c.outcome}`)}</Chip>}
            </div>
          </div>
          <div className="rounded-xl bg-slate-100 px-3 py-1.5 text-center dark:bg-slate-800">
            <div className="text-2xl leading-none font-bold tabular-nums">{formatNumber(effectivePriority(c))}</div>
            <div className="mt-0.5 text-[10px] font-medium text-slate-500">{t("priority")}</div>
          </div>
        </div>
      </Card>

      {original && open && (
        <section className="rounded-2xl border border-orange-300 bg-orange-50 p-4 text-orange-950 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-100">
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <Copy size={16} aria-hidden />
            {t("possibleDuplicate")}
          </h3>
          <p className="mt-1 text-xs opacity-85">{t("duplicateHint")}</p>
          <button
            type="button"
            onClick={() => onSelect(original.id)}
            className="mt-2.5 w-full rounded-xl bg-white/70 p-2.5 text-start text-sm transition hover:bg-white dark:bg-slate-900/60 dark:hover:bg-slate-900"
          >
            <span className="flex items-center gap-1.5 text-xs font-semibold text-orange-700 dark:text-orange-300">
              {t("openOriginal")}
              <ArrowRight size={13} className="rtl:-scale-x-100" aria-hidden />
            </span>
            <span dir="auto" className="mt-0.5 line-clamp-2 block">
              {original.description}
            </span>
          </button>
          <div className="mt-3 flex gap-2">
            <Button
              variant="primary"
              icon={GitMerge}
              onClick={() => onAction({ action: "merge", intoId: original.id })}
              className="flex-1"
            >
              {t("mergeInto")}
            </Button>
            <Button icon={X} onClick={() => onAction({ action: "not_duplicate" })}>
              {t("notDuplicate")}
            </Button>
          </div>
        </section>
      )}

      <SummaryCard c={c} sev={sev} />

      <Card>
        <SectionTitle icon={FileText}>{t("reportDetails")}</SectionTitle>
        {c.photo && (
          // eslint-disable-next-line @next/next/no-img-element -- data URL from the resident
          <img
            src={c.photo}
            alt={t("photoAttached")}
            className="mb-3 max-h-56 w-full rounded-xl bg-slate-900 object-contain"
          />
        )}
        {c.photoAnalysis && (
          <div className="mb-3">
            <AnalysisCard analysis={c.photoAnalysis} />
          </div>
        )}
        <p
          dir="auto"
          className="rounded-xl border-s-4 border-slate-300 bg-slate-50 px-3 py-2 text-sm leading-relaxed whitespace-pre-line dark:border-slate-600 dark:bg-slate-800/60"
        >
          {c.description || "—"}
        </p>
        <dl className="mt-3 space-y-2 text-sm">
          <Meta icon={Users} label={t("affectedTotal")}>
            {formatNumber(Math.max(1, totalAffected(c.affected)))}
          </Meta>
          <div className="flex flex-wrap justify-end gap-1">
            {AFFECTED_GROUPS.filter((g) => c.affected[g] > 0).map((g) => (
              <Chip key={g} tone={g === "trapped" ? "red" : g === "adults" ? "neutral" : "sky"} icon={AFFECTED_ICON[g]}>
                {t(`group_${g}`)} {formatNumber(c.affected[g])}
              </Chip>
            ))}
          </div>
          <Meta icon={Clock} label={t("received")}>
            {now ? timeAgo(c.createdAt, now, locale) : ""}
          </Meta>
          <Meta icon={MapPin} label={t("sosLocation")}>
            <span dir="ltr" className="tabular-nums">
              {c.position[0].toFixed(4)}, {c.position[1].toFixed(4)}
            </span>
          </Meta>
          <Meta icon={MessageSquare} label={t("channel")}>
            {t(`channel_${c.channel}`)}
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
          {c.triage.teams.map((team) => (
            <Chip key={team} icon={TEAM_ICON[team]}>
              {pick(TEAM_LABELS[team])}
            </Chip>
          ))}
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
              disabled={!open}
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

      <DispatchCard c={c} teams={teams} suggestions={suggestions} onAction={onAction} />

      {open && <ReassessCard key={c.updatedAt} c={c} onAction={onAction} />}

      {c.history.length > 1 && <HistoryCard c={c} />}

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

function SummaryCard({ c, sev }: { c: SosCase; sev: Severity }) {
  const { t, pick } = useI18n();
  const [copied, setCopied] = useState(false);
  const text = pick(summarizeCase(c, sev));
  return (
    <Card className="border-brand-navy/20 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900">
      <SectionTitle
        icon={ClipboardCopy}
        aside={
          <Button
            size="sm"
            icon={copied ? Check : Copy}
            onClick={() => {
              navigator.clipboard?.writeText(text).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              });
            }}
          >
            {copied ? t("copied") : t("copy")}
          </Button>
        }
      >
        {t("summaryTitle")}
      </SectionTitle>
      <p className="text-sm leading-relaxed">{text}</p>
    </Card>
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
        <div className="truncate text-sm font-semibold">{pick(team.name)}</div>
      </div>
      {children}
    </div>
  );
}

/** Required resources, suggested teams, assigned teams and case progress. */
function DispatchCard({
  c,
  teams,
  suggestions,
  onAction,
}: {
  c: SosCase;
  teams: Team[];
  suggestions: TeamOption[] | undefined;
  onAction: (action: CaseAction) => Promise<void> | void;
}) {
  const { t, pick, formatNumber } = useI18n();
  const [outcome, setOutcome] = useState<(typeof OUTCOMES)[number]>("rescued");
  const open = isOpen(c);
  const assigned = c.teamIds.map((id) => teams.find((tm) => tm.id === id)).filter((tm): tm is Team => !!tm);
  const missing = missingTeams(c, teams);
  const others = anyTeamOptions(c, teams).filter((o) => !suggestions?.some((s) => s.team.id === o.team.id));

  return (
    <Card>
      <SectionTitle icon={Wrench}>{t("requiredResources")}</SectionTitle>
      <ul className="space-y-1.5">
        {c.triage.resources.teams.map(({ type, count }) => {
          const have = count - missing.filter((m) => m === type).length;
          const Icon = TEAM_ICON[type];
          const done = have >= count;
          return (
            <li key={type} className="flex items-center gap-2.5 text-sm">
              <Icon size={16} className="text-slate-400" aria-hidden />
              <span className="flex-1">{pick(TEAM_LABELS[type])}</span>
              <span
                className={`rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums ${
                  done
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {formatNumber(have)}/{formatNumber(count)}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">{t("equipment")}</div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {c.triage.resources.equipment.map((e) => (
          <Chip key={e.en}>{pick(e)}</Chip>
        ))}
      </div>

      <div className="my-4 h-px bg-slate-200 dark:bg-slate-800" />
      <SectionTitle icon={Route}>{t("dispatchTitle")}</SectionTitle>

      {open && suggestions && suggestions.length > 0 && (
        <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-500/25 dark:bg-emerald-500/5">
          <div className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <Sparkles size={13} aria-hidden />
            {t("suggestedTeams")}
          </div>
          <div className="space-y-2.5">
            {suggestions.map((s) => (
              <TeamRow key={s.team.id} team={s.team} label={pick(TEAM_LABELS[s.forType])} tone="green">
                <Chip icon={Timer}>
                  ~{formatNumber(etaMinutes(s.etaS))} {t("min")}
                </Chip>
                <Button
                  size="sm"
                  variant="success"
                  icon={Send}
                  mirrorIcon
                  aria-label={t("approveDispatch")}
                  onClick={() => onAction({ action: "assign", teamId: s.team.id })}
                />
              </TeamRow>
            ))}
          </div>
          <p className="mt-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {suggestions.some((s) => s.substitute) ? t("substituteNote") : t("dispatchReason")}
          </p>
          {suggestions.length > 1 && (
            <Button
              variant="success"
              icon={Send}
              mirrorIcon
              onClick={async () => {
                // One at a time, so the last reply carries every assignment.
                for (const s of suggestions) await onAction({ action: "assign", teamId: s.team.id });
              }}
              className="mt-3 w-full"
            >
              {t("assignAllSuggested")}
            </Button>
          )}
        </div>
      )}

      {open && missing.length > 0 && (!suggestions || suggestions.length === 0) && (
        <p className="mb-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          {t("noTeamAvailable")}
        </p>
      )}
      {open && missing.length === 0 && assigned.length > 0 && (
        <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          <CircleCheck size={14} aria-hidden />
          {t("allTeamsAssigned")}
        </p>
      )}

      {assigned.length > 0 && (
        <div className="space-y-2.5">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t("assignedTeams")}</div>
          {assigned.map((team) => (
            <TeamRow
              key={team.id}
              team={team}
              label={t(`team_${team.status}`)}
              tone={team.status === "on_scene" ? "blue" : "amber"}
            >
              {c.status === "assigned" && (
                <Chip icon={Timer}>
                  ~{formatNumber(etaMinutes(estimateTravel(team.base, c.position).etaS))} {t("min")}
                </Chip>
              )}
              {open && (
                <button
                  type="button"
                  onClick={() => onAction({ action: "release", teamId: team.id })}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800"
                  aria-label={t("releaseTeam")}
                  title={t("releaseTeam")}
                >
                  <X size={16} aria-hidden />
                </button>
              )}
            </TeamRow>
          ))}
        </div>
      )}

      {open && others.length > 0 && (
        <label className="mt-3 block">
          <span className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">{t("addTeam")}</span>
          <select
            value=""
            onChange={(e) => e.target.value && onAction({ action: "assign", teamId: e.target.value })}
            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">—</option>
            {others.map((o) => (
              <option key={o.team.id} value={o.team.id}>
                {pick(o.team.name)} · ~{formatNumber(etaMinutes(o.etaS))} {t("min")}
              </option>
            ))}
          </select>
        </label>
      )}

      {(c.status === "assigned" || c.status === "on_scene") && (
        <div className="mt-4 space-y-2">
          {c.status === "assigned" && (
            <Button variant="info" icon={MapPin} onClick={() => onAction({ action: "on_scene" })} className="w-full">
              {t("markOnScene")}
            </Button>
          )}
          <div className="flex gap-2">
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value as typeof outcome)}
              aria-label={t("chooseOutcome")}
              className="h-10 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              {OUTCOMES.map((o) => (
                <option key={o} value={o}>
                  {t(`outcome_${o}`)}
                </option>
              ))}
            </select>
            <Button icon={CheckCheck} onClick={() => onAction({ action: "resolve", outcome })}>
              {t("resolveCase")}
            </Button>
          </div>
        </div>
      )}

      {c.status === "resolved" && (
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-slate-100 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <CircleCheck size={18} className="text-emerald-600" aria-hidden />
          {c.outcome ? t(`outcome_${c.outcome}`) : t("case_resolved")}
        </p>
      )}
    </Card>
  );
}

/** Update the affected counts or add what changed; the case is re-triaged and re-ranked. */
function ReassessCard({ c, onAction }: { c: SosCase; onAction: (action: CaseAction) => void }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [counts, setCounts] = useState(c.affected);
  const [note, setNote] = useState("");

  return (
    <Card>
      <button type="button" onClick={() => setExpanded((e) => !e)} className="w-full text-start">
        <SectionTitle icon={RefreshCw} aside={<span className="text-xs text-slate-400">{expanded ? "−" : "+"}</span>}>
          {t("reassessTitle")}
        </SectionTitle>
      </button>
      {expanded && (
        <div className="space-y-3">
          <AffectedCounter value={counts} onChange={setCounts} />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            dir="auto"
            placeholder={t("reassessNote")}
            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <Button
            variant="primary"
            icon={RefreshCw}
            onClick={() => onAction({ action: "reassess", affected: counts, note })}
            className="w-full"
          >
            {t("reassessApply")}
          </Button>
        </div>
      )}
    </Card>
  );
}

function HistoryCard({ c }: { c: SosCase }) {
  const { t, pick, locale, formatNumber } = useI18n();
  const timeFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", { timeStyle: "short" });
  return (
    <Card>
      <SectionTitle icon={History}>{t("historyTitle")}</SectionTitle>
      <ol className="space-y-2 border-s-2 border-slate-200 ps-3 dark:border-slate-700">
        {[...c.history].reverse().map((h, i) => (
          <li key={h.at + "-" + i} className="text-sm">
            <div className="flex items-center gap-2">
              <SeverityDot severity={h.severity} />
              <span className="font-semibold">{pick(SEVERITY_LABELS[h.severity])}</span>
              <span className="text-xs text-slate-500">
                {t("priority")} {formatNumber(h.priority)}
              </span>
              <span className="ms-auto text-xs text-slate-400 tabular-nums">{timeFmt.format(h.at)}</span>
            </div>
            <p dir="auto" className="text-xs text-slate-600 dark:text-slate-300">
              {pick(h.reason)}
            </p>
          </li>
        ))}
      </ol>
    </Card>
  );
}
