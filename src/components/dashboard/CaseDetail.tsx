"use client";

import { CASE_STATUS_STYLE } from "@/components/dashboard/CaseQueue";
import { etaMinutes, timeAgo } from "@/components/dashboard/format";
import { SEVERITY_STYLE, SeverityBadge } from "@/components/severity";
import { effectivePriority, effectiveSeverity, needsTeam, teamOptions, type TeamOption } from "@/lib/dispatch";
import { HAZARD_ICONS, HAZARD_LABELS, SEVERITY_LABELS, TEAM_ICONS, TEAM_LABELS, useI18n } from "@/lib/i18n";
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
  const v = c.vulnerable;
  const vulnerable = c.shareVulnerable
    ? [v.children && t("children"), v.elderly && t("elderly"), v.disabled && t("disabled")].filter(Boolean)
    : [];

  return (
    <div className="space-y-4 p-4">
      <header>
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-xl font-bold">
            {HAZARD_ICONS[c.triage.hazard]} {pick(HAZARD_LABELS[c.triage.hazard])}
          </h2>
          <div className="text-center">
            <div className="text-2xl font-bold tabular-nums leading-none">{formatNumber(effectivePriority(c))}</div>
            <div className="text-[10px] text-slate-500">{t("priority")}</div>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
          <SeverityBadge severity={sev} />
          <span className={`rounded-full px-2 py-0.5 font-medium ${CASE_STATUS_STYLE[c.status]}`}>
            {t(`case_${c.status}`)}
          </span>
        </div>
      </header>

      <section className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{t("reportDetails")}</h3>
        <p dir="auto" className="leading-relaxed">
          {c.description || "—"}
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
          <dt className="text-slate-500">{t("people")}</dt>
          <dd>👥 {formatNumber(c.peopleCount)}</dd>
          {vulnerable.length > 0 && (
            <>
              <dt className="text-slate-500">{t("extraSupport")}</dt>
              <dd>{vulnerable.join(locale === "ar" ? "، " : ", ")}</dd>
            </>
          )}
          <dt className="text-slate-500">{t("received")}</dt>
          <dd>{now ? timeAgo(c.createdAt, now, locale) : ""}</dd>
          <dt className="text-slate-500">{t("sosLocation")}</dt>
          <dd dir="ltr" className="text-start tabular-nums">
            {c.position[0].toFixed(4)}, {c.position[1].toFixed(4)}
          </dd>
          <dt className="text-slate-500">{t("origin")}</dt>
          <dd>{c.origin === "resident" ? t("origin_resident") : t("origin_demo")}</dd>
        </dl>
      </section>

      <section className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">{t("aiAssessment")}</h3>
          <span className="text-xs text-slate-500">
            {c.triage.source === "ai" ? `🤖 ${t("sourceAi")}` : `⚙️ ${t("sourceRules")}`}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <SeverityBadge severity={c.triage.severity} />
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs dark:bg-slate-700">
            {TEAM_ICONS[c.triage.team]} {pick(TEAM_LABELS[c.triage.team])}
          </span>
        </div>
        <p className="mt-2">{pick(c.triage.reasoning)}</p>
      </section>

      <section className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
        <h3 className="font-semibold">👤 {t("humanReviewTitle")}</h3>
        <p className="mt-0.5 text-xs text-slate-500">{t("reviewHint")}</p>
        <div className="mt-2 grid grid-cols-4 gap-1.5" role="radiogroup">
          {SEVERITIES.map((s) => (
            <button
              key={s}
              role="radio"
              aria-checked={sev === s}
              disabled={c.status === "resolved"}
              onClick={() => onAction({ action: "review", severity: s })}
              className={`rounded-lg border px-1 py-1.5 text-xs transition disabled:opacity-50 ${
                sev === s
                  ? `${SEVERITY_STYLE[s].badge} border-current font-bold`
                  : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              }`}
            >
              {SEVERITY_STYLE[s].dot}
              <br />
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
          <button
            onClick={() => onAction({ action: "review", severity: sev })}
            className="mt-3 w-full rounded-lg bg-slate-900 py-2 font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900"
          >
            ✓ {t("confirmAssessment")}
          </button>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
        <h3 className="font-semibold">🧭 {t("dispatchTitle")}</h3>

        {needsTeam(c) && (
          <DispatchSuggestion c={c} teams={teams} suggestion={suggestion} onAction={onAction} />
        )}

        {team && (c.status === "assigned" || c.status === "on_scene") && (
          <div className="mt-2 space-y-3">
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
              <div className="text-xs text-slate-500">{t("assignedTeam")}</div>
              <div className="font-semibold">
                {TEAM_ICONS[team.type]} {pick(team.name)}
              </div>
              {c.status === "assigned" && c.etaS !== undefined && (
                <div className="text-xs text-slate-500">
                  {t("eta")}: ~{formatNumber(etaMinutes(c.etaS))} {t("min")}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {c.status === "assigned" && (
                <button
                  onClick={() => onAction({ action: "on_scene" })}
                  className="flex-1 rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700"
                >
                  📍 {t("markOnScene")}
                </button>
              )}
              <button
                onClick={() => onAction({ action: "resolve" })}
                className="flex-1 rounded-lg border border-slate-300 py-2 font-semibold hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
              >
                ✔️ {t("resolveCase")}
              </button>
            </div>
          </div>
        )}

        {c.status === "resolved" && <p className="mt-2 text-slate-500">✔️ {t("case_resolved")}</p>}
      </section>

      <p className="text-xs text-slate-500">{t("dispatchDisclaimer")}</p>
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
    <div className="mt-2 space-y-3">
      {suggestion ? (
        <div className="rounded-lg border-2 border-green-600/40 bg-green-50 p-3 dark:bg-green-950/40">
          <div className="text-xs font-semibold text-green-800 dark:text-green-300">✨ {t("suggestedTeam")}</div>
          <div className="mt-1 font-semibold">
            {TEAM_ICONS[suggestion.team.type]} {pick(suggestion.team.name)}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300">
            {formatNumber(suggestion.distanceM / 1000, 1)} {t("km")} · {t("eta")} ~
            {formatNumber(etaMinutes(suggestion.etaS))} {t("min")}
          </div>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
            {suggestion.substitute ? t("substituteNote") : t("dispatchReason")}
          </p>
          <button
            onClick={() => onAction({ action: "assign", teamId: suggestion.team.id })}
            className="mt-3 w-full rounded-lg bg-green-600 py-2 font-semibold text-white hover:bg-green-700"
          >
            {t("approveDispatch")}
          </button>
        </div>
      ) : (
        <p className="rounded-lg bg-amber-50 p-3 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {t("noTeamAvailable")}
        </p>
      )}

      {options.length > 0 && (
        <label className="block">
          <span className="mb-1 block text-xs text-slate-500">{t("otherTeam")}</span>
          <select
            value=""
            onChange={(e) => e.target.value && onAction({ action: "assign", teamId: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-transparent p-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          >
            <option value="">—</option>
            {options.map((o) => (
              <option key={o.team.id} value={o.team.id}>
                {TEAM_ICONS[o.team.type]} {pick(o.team.name)} · ~{formatNumber(etaMinutes(o.etaS))} {t("min")}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
