"use client";

import {
  CarFront,
  Footprints,
  Info,
  LoaderCircle,
  MapPin,
  Phone,
  Route,
  ShieldCheck,
  Timer,
  TriangleAlert,
  Users,
  type LucideIcon,
} from "lucide-react";
import { HAZARD_ICON, PLACE_ICON } from "@/components/icons";
import { Card, SectionTitle } from "@/components/ui";
import { EMERGENCY_NUMBERS, GUIDANCE } from "@/lib/data/guidance";
import { HAZARD_LABELS, useI18n } from "@/lib/i18n";
import { useAppState } from "@/lib/store";
import type { GuidanceRoute } from "@/lib/use-guidance-route";

/** During a missile alert, a shelter further than this on foot is out of reach in time. */
const MAX_SHELTER_WALK_S = 5 * 60;

export function AlertPanel({ guidance }: { guidance: GuidanceRoute }) {
  const { t, pick, formatNumber } = useI18n();
  const { scenario, inZone } = useAppState();

  if (!scenario) {
    return (
      <div className="space-y-3">
        <Card className="py-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
            <ShieldCheck size={28} aria-hidden />
          </span>
          <p className="mt-3 text-base font-bold">{t("noActiveAlert")}</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">{t("noActiveAlertHint")}</p>
        </Card>
        <EmergencyNumbers />
      </div>
    );
  }

  const g = GUIDANCE[scenario.hazard];
  const HazardIcon = HAZARD_ICON[scenario.hazard];

  return (
    <div className="space-y-3">
      <section
        role="alert"
        className={`overflow-hidden rounded-2xl p-4 text-white shadow-lg ${
          inZone
            ? "bg-gradient-to-br from-red-600 to-red-700 shadow-red-600/20"
            : "bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/20"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
            <HazardIcon size={20} aria-hidden />
          </span>
          <span className="text-sm font-semibold opacity-95">{pick(HAZARD_LABELS[scenario.hazard])}</span>
        </div>
        <p className="mt-3 leading-relaxed">{pick(scenario.alert)}</p>
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">
          <MapPin size={14} aria-hidden />
          {inZone ? t("youAreInZone") : t("youAreOutsideZone")}
        </p>
      </section>

      {inZone ? (
        <ActionCard guidance={guidance} />
      ) : (
        <Card className="flex gap-3 text-sm">
          <Info size={18} className="mt-0.5 shrink-0 text-slate-400" aria-hidden />
          <p>{t("outsideZoneHint")}</p>
        </Card>
      )}

      <Card>
        <SectionTitle icon={HazardIcon}>
          {t("safetySteps")} · {pick(g.title)}
        </SectionTitle>
        <ol className="space-y-2.5 text-sm leading-relaxed">
          {g.steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {formatNumber(i + 1)}
              </span>
              <span className="pt-0.5">{pick(s)}</span>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex gap-3 rounded-xl bg-sky-50 p-3 text-sm text-sky-950 dark:bg-sky-500/10 dark:text-sky-100">
          <Users size={18} className="mt-0.5 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden />
          <div>
            <div className="font-semibold">{t("forKids")}</div>
            <p className="mt-0.5">{pick(g.simple)}</p>
          </div>
        </div>
      </Card>

      <EmergencyNumbers />
    </div>
  );
}

function ActionCard({ guidance }: { guidance: GuidanceRoute }) {
  const { t, pick, formatNumber } = useI18n();
  const { scenario } = useAppState();
  if (!scenario) return null;

  const shelterOutOfReach =
    scenario.action === "shelter" && !!guidance.route && guidance.route.durationS > MAX_SHELTER_WALK_S;
  const actionLabel =
    scenario.action === "shelter"
      ? t("actionShelter")
      : scenario.action === "evacuate"
        ? t("actionEvacuate")
        : t("actionAvoid");
  const ModeIcon = guidance.mode === "foot" ? Footprints : CarFront;
  const dest = guidance.destination;
  const PlaceIcon = dest ? PLACE_ICON[dest.kind] : ShieldCheck;

  return (
    <Card>
      {shelterOutOfReach ? (
        <div className="mb-4 flex gap-3 rounded-xl bg-red-50 p-3 text-red-900 dark:bg-red-500/10 dark:text-red-200">
          <TriangleAlert size={22} className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
          <div>
            <h3 className="text-base font-bold">{t("shelterInPlaceTitle")}</h3>
            <p className="mt-1 text-sm">{t("shelterInPlaceBody")}</p>
          </div>
        </div>
      ) : (
        <h3 className="mb-3 text-lg font-bold">{actionLabel}</h3>
      )}

      {dest && (
        <>
          {shelterOutOfReach && (
            <p className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t("nearestShelterIfDirected")}
            </p>
          )}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                dest.kind === "shelter"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                  : "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300"
              }`}
            >
              <PlaceIcon size={20} aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="text-xs text-slate-500 dark:text-slate-400">{t("destination")}</div>
              <div className="truncate font-semibold">{pick(dest.name)}</div>
            </div>
          </div>

          {guidance.loading && !guidance.route ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
              <LoaderCircle size={16} className="animate-spin" aria-hidden />
              {t("routeCalculating")}
            </p>
          ) : (
            guidance.route && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Stat icon={Route} label={t("distance")}>
                  {formatNumber(guidance.route.distanceM / 1000, 1)} {t("km")}
                </Stat>
                <Stat icon={Timer} label={t("eta")}>
                  {formatNumber(Math.max(1, Math.round(guidance.route.durationS / 60)))} {t("min")}
                  <span className="ms-1 inline-flex align-middle text-slate-400">
                    <ModeIcon size={14} aria-label={guidance.mode === "foot" ? t("routeWalk") : t("routeDrive")} />
                  </span>
                </Stat>
              </div>
            )
          )}
          {guidance.route?.alternative && (
            <p className="mt-2 flex gap-1.5 rounded-lg bg-emerald-50 p-2 text-xs font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
              <TriangleAlert size={13} className="mt-0.5 shrink-0" aria-hidden />
              {t("directRouteBlocked")} – {t("alternativeRoute")}
            </p>
          )}
          {guidance.route && !guidance.route.routed && (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">{t("routeStraight")}</p>
          )}
          <p className="mt-3 flex gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Info size={13} className="mt-0.5 shrink-0" aria-hidden />
            {t("routeDisclaimer")}
          </p>
        </>
      )}
    </Card>
  );
}

function Stat({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Icon size={13} aria-hidden />
        {label}
      </div>
      <div className="mt-1 text-lg font-bold tabular-nums">{children}</div>
    </div>
  );
}

function EmergencyNumbers() {
  const { t, pick } = useI18n();
  return (
    <Card>
      <SectionTitle icon={Phone}>{t("emergencyNumbers")}</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        {EMERGENCY_NUMBERS.map((n) => (
          <a
            key={n.number}
            href={`tel:${n.number}`}
            className="group flex items-center gap-3 rounded-xl border border-slate-200 p-2.5 transition hover:border-red-300 hover:bg-red-50 dark:border-slate-700 dark:hover:border-red-500/40 dark:hover:bg-red-500/10"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition group-hover:bg-red-600 group-hover:text-white dark:bg-slate-800">
              <Phone size={16} aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="text-lg leading-tight font-bold tabular-nums" dir="ltr">
                {n.number}
              </div>
              <div className="truncate text-xs text-slate-500 dark:text-slate-400">{pick(n.label)}</div>
            </div>
          </a>
        ))}
      </div>
    </Card>
  );
}
