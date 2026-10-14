"use client";

import { ChevronDown, LocateFixed, MapPin, SlidersHorizontal, Square, WifiOff } from "lucide-react";
import { useState } from "react";
import { HazardTile } from "@/components/icons";
import { Button } from "@/components/ui";
import { SCENARIOS } from "@/lib/data/scenarios";
import { zoneSamplePoint } from "@/lib/geo";
import { useI18n } from "@/lib/i18n";
import { useAppState } from "@/lib/store";

export function SimulationPanel() {
  const { t, pick } = useI18n();
  const {
    scenario,
    startScenario,
    stopScenario,
    simulatedOffline,
    setSimulatedOffline,
    setUserPos,
    inZone,
    requestFocus,
  } = useAppState();
  // null = default: collapsed on phones, open on wider screens (decided by CSS to avoid a hydration mismatch).
  const [open, setOpen] = useState<boolean | null>(null);
  const bodyVisibility = open === null ? "hidden md:block" : open ? "block" : "hidden";
  const chevron = open === null ? "rotate-180 md:rotate-0" : open ? "" : "rotate-180";

  function locateMe() {
    navigator.geolocation?.getCurrentPosition((p) => {
      setUserPos([p.coords.latitude, p.coords.longitude]);
      requestFocus();
    });
  }

  return (
    <div className="w-76 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-xl shadow-slate-900/10 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <button
        type="button"
        onClick={() => setOpen((o) => (o === null ? !window.matchMedia("(min-width: 768px)").matches : !o))}
        className="flex w-full items-center gap-2 px-4 py-3 text-sm font-bold"
      >
        <SlidersHorizontal size={16} className="text-slate-400" aria-hidden />
        <span className="flex-1 text-start">{t("simTitle")}</span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${chevron}`} aria-hidden />
      </button>

      <div
        className={`${bodyVisibility} space-y-4 border-t border-slate-200 px-3 pt-3 pb-4 text-sm dark:border-slate-800`}
      >
        <div className="space-y-1.5">
          {SCENARIOS.map((s) => {
            const active = scenario?.id === s.id;
            return (
              <button
                type="button"
                key={s.id}
                onClick={() => (active ? stopScenario() : startScenario(s.id))}
                aria-pressed={active}
                className={`flex w-full items-center gap-2.5 rounded-xl border p-2 text-start transition ${
                  active
                    ? "border-red-300 bg-red-50 dark:border-red-500/40 dark:bg-red-500/10"
                    : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <HazardTile hazard={s.hazard} size="sm" />
                <span
                  className={`flex-1 leading-tight ${active ? "font-semibold text-red-700 dark:text-red-300" : ""}`}
                >
                  {pick(s.name)}
                </span>
                {active && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                    <Square size={9} fill="currentColor" aria-hidden />
                    {t("simStop")}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="space-y-2 px-1">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t("simLocation")}</div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              icon={MapPin}
              disabled={!scenario || inZone}
              onClick={() => scenario && setUserPos(zoneSamplePoint(scenario.zone))}
              className="h-auto min-h-8 py-1.5 whitespace-normal"
            >
              {t("simMoveInto")}
            </Button>
            <Button size="sm" icon={LocateFixed} onClick={locateMe} className="h-auto min-h-8 py-1.5 whitespace-normal">
              {t("simUseGps")}
            </Button>
          </div>
        </div>

        <label className="flex cursor-pointer items-center justify-between gap-2 px-1">
          <span className="flex items-center gap-2">
            <WifiOff size={15} className="text-slate-400" aria-hidden />
            {t("simOffline")}
          </span>
          <span className="relative inline-flex">
            <input
              type="checkbox"
              role="switch"
              checked={simulatedOffline}
              onChange={(e) => setSimulatedOffline(e.target.checked)}
              className="peer sr-only"
            />
            <span className="h-6 w-10 rounded-full bg-slate-300 transition peer-checked:bg-red-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-green dark:bg-slate-700" />
            <span className="absolute start-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4 rtl:peer-checked:-translate-x-4" />
          </span>
        </label>
      </div>
    </div>
  );
}
