"use client";

import { EMERGENCY_NUMBERS, GUIDANCE } from "@/lib/data/guidance";
import { HAZARD_ICONS, HAZARD_LABELS, useI18n } from "@/lib/i18n";
import { useAppState } from "@/lib/store";
import type { GuidanceRoute } from "@/lib/use-guidance-route";

/** During a missile alert, a shelter further than this on foot is out of reach in time. */
const MAX_SHELTER_WALK_S = 5 * 60;

export function AlertPanel({ guidance }: { guidance: GuidanceRoute }) {
  const { t, pick, formatNumber } = useI18n();
  const { scenario, inZone } = useAppState();

  if (!scenario) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center dark:border-slate-700">
          <div className="text-3xl">🟢</div>
          <p className="mt-2 font-semibold">{t("noActiveAlert")}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("noActiveAlertHint")}</p>
        </div>
        <EmergencyNumbers />
      </div>
    );
  }

  const g = GUIDANCE[scenario.hazard];
  const shelterOutOfReach =
    scenario.action === "shelter" && !!guidance.route && guidance.route.durationS > MAX_SHELTER_WALK_S;
  const actionLabel =
    scenario.action === "shelter" ? t("actionShelter") : scenario.action === "evacuate" ? t("actionEvacuate") : t("actionAvoid");

  return (
    <div className="space-y-5">
      <section
        className={`rounded-xl p-4 text-white shadow-sm ${inZone ? "bg-red-600" : "bg-amber-600"}`}
        role="alert"
      >
        <div className="flex items-center gap-2 text-sm font-medium opacity-90">
          <span className="text-lg">{HAZARD_ICONS[scenario.hazard]}</span>
          {pick(HAZARD_LABELS[scenario.hazard])}
        </div>
        <p className="mt-2 leading-relaxed">{pick(scenario.alert)}</p>
        <p className="mt-3 inline-block rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">
          {inZone ? t("youAreInZone") : t("youAreOutsideZone")}
        </p>
      </section>

      {inZone ? (
        <section className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          {shelterOutOfReach ? (
            <div className="mb-3 rounded-lg bg-red-50 p-3 text-red-900 dark:bg-red-950 dark:text-red-200">
              <h3 className="text-lg font-bold">⚠️ {t("shelterInPlaceTitle")}</h3>
              <p className="mt-1 text-sm">{t("shelterInPlaceBody")}</p>
            </div>
          ) : (
            <h3 className="text-lg font-bold">{actionLabel}</h3>
          )}
          {shelterOutOfReach && (
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t("nearestShelterIfDirected")}</p>
          )}
          {guidance.destination && (
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400">{t("destination")}</span>
                <span className="font-semibold">
                  {scenario.action === "shelter" ? "🛡️" : "🚩"} {pick(guidance.destination.name)}
                </span>
              </div>
              {guidance.loading && !guidance.route ? (
                <p className="text-slate-500">{t("routeCalculating")}</p>
              ) : (
                guidance.route && (
                  <>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500 dark:text-slate-400">{t("distance")}</span>
                      <span>
                        {formatNumber(guidance.route.distanceM / 1000, 1)} {t("km")}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500 dark:text-slate-400">{t("eta")}</span>
                      <span>
                        {formatNumber(Math.max(1, Math.round(guidance.route.durationS / 60)))} {t("min")}{" "}
                        {guidance.mode === "foot" ? t("routeWalk") : t("routeDrive")}
                      </span>
                    </div>
                    {!guidance.route.routed && (
                      <p className="text-xs text-amber-700 dark:text-amber-400">{t("routeStraight")}</p>
                    )}
                  </>
                )
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400">{t("routeDisclaimer")}</p>
            </div>
          )}
        </section>
      ) : (
        <p className="rounded-xl bg-slate-100 p-4 text-sm dark:bg-slate-800">{t("outsideZoneHint")}</p>
      )}

      <section>
        <h3 className="mb-2 font-bold">
          {t("safetySteps")} – {pick(g.title)}
        </h3>
        <ol className="list-decimal space-y-1.5 ps-5 text-sm leading-relaxed">
          {g.steps.map((s, i) => (
            <li key={i}>{pick(s)}</li>
          ))}
        </ol>
        <div className="mt-3 rounded-xl bg-sky-50 p-3 text-sm dark:bg-sky-950">
          <div className="font-semibold">👨‍👩‍👧 {t("forKids")}</div>
          <p className="mt-1">{pick(g.simple)}</p>
        </div>
      </section>

      <EmergencyNumbers />
    </div>
  );
}

function EmergencyNumbers() {
  const { t, pick } = useI18n();
  return (
    <section>
      <h3 className="mb-2 font-bold">{t("emergencyNumbers")}</h3>
      <div className="grid grid-cols-2 gap-2">
        {EMERGENCY_NUMBERS.map((n) => (
          <a
            key={n.number}
            href={`tel:${n.number}`}
            className="rounded-lg border border-slate-200 p-2 text-center hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <div className="text-xl font-bold tabular-nums" dir="ltr">
              {n.number}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{pick(n.label)}</div>
          </a>
        ))}
      </div>
    </section>
  );
}
