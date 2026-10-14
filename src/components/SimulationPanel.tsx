"use client";

import { useState } from "react";
import { SCENARIOS } from "@/lib/data/scenarios";
import { zoneSamplePoint } from "@/lib/geo";
import { HAZARD_ICONS, useI18n } from "@/lib/i18n";
import { useAppState } from "@/lib/store";

export function SimulationPanel() {
  const { t, pick } = useI18n();
  const { scenario, startScenario, stopScenario, simulatedOffline, setSimulatedOffline, setUserPos, inZone, requestFocus } =
    useAppState();
  // null = default: collapsed on phones, open on wider screens (decided by CSS to avoid a hydration mismatch).
  const [open, setOpen] = useState<boolean | null>(null);
  const bodyVisibility = open === null ? "hidden md:block" : open ? "block" : "hidden";

  function locateMe() {
    navigator.geolocation?.getCurrentPosition((p) => {
      setUserPos([p.coords.latitude, p.coords.longitude]);
      requestFocus();
    });
  }

  return (
    <div className="w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <button
        onClick={() => setOpen((o) => (o === null ? !window.matchMedia("(min-width: 768px)").matches : !o))}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-bold"
      >
        <span>🎛️ {t("simTitle")}</span>
        <span className="text-slate-400">
          {open === null ? (
            <>
              <span className="md:hidden">▸</span>
              <span className="hidden md:inline">▾</span>
            </>
          ) : open ? (
            "▾"
          ) : (
            "▸"
          )}
        </span>
      </button>

      <div className={`${bodyVisibility} space-y-3 border-t border-slate-200 px-4 pb-4 pt-3 text-sm dark:border-slate-700`}>
        <div className="space-y-1.5">
          {SCENARIOS.map((s) => {
            const active = scenario?.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => (active ? stopScenario() : startScenario(s.id))}
                className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-start transition ${
                  active
                    ? "border-red-500 bg-red-50 font-semibold text-red-700 dark:bg-red-950 dark:text-red-300"
                    : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                }`}
              >
                <span className="text-lg">{HAZARD_ICONS[s.hazard]}</span>
                <span className="flex-1">{pick(s.name)}</span>
                {active && <span className="text-xs">■ {t("simStop")}</span>}
              </button>
            );
          })}
        </div>

        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t("simLocation")}</div>
          <div className="flex gap-2">
            <button
              disabled={!scenario || inZone}
              onClick={() => scenario && setUserPos(zoneSamplePoint(scenario.zone))}
              className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs disabled:opacity-40 dark:border-slate-700"
            >
              📍 {t("simMoveInto")}
            </button>
            <button
              onClick={locateMe}
              className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-700"
            >
              🛰️ {t("simUseGps")}
            </button>
          </div>
        </div>

        <label className="flex cursor-pointer items-center justify-between gap-2">
          <span>📵 {t("simOffline")}</span>
          <input
            type="checkbox"
            role="switch"
            checked={simulatedOffline}
            onChange={(e) => setSimulatedOffline(e.target.checked)}
            className="h-4 w-4 accent-red-600"
          />
        </label>
      </div>
    </div>
  );
}
