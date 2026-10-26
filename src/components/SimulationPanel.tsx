"use client";

import { ChevronDown, Layers, LocateFixed, MapPin, SlidersHorizontal, Square, WifiOff, X } from "lucide-react";
import { useState } from "react";
import { HazardTile } from "@/components/icons";
import { Button } from "@/components/ui";
import { SCENARIOS } from "@/lib/data/scenarios";
import { zoneSamplePoint } from "@/lib/geo";
import { useI18n } from "@/lib/i18n";
import { useAppState } from "@/lib/store";

/** Desktop: a collapsible card in the corner of the map. */
export function SimulationPanel() {
  const { t } = useI18n();
  const [open, setOpen] = useState(true);

  return (
    <div className="w-76 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-xl shadow-slate-900/10 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-3 text-sm font-bold"
      >
        <SlidersHorizontal size={16} className="text-slate-400" aria-hidden />
        <span className="flex-1 text-start">{t("simTitle")}</span>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform ${open ? "" : "rotate-180"}`}
          aria-hidden
        />
      </button>
      {open && (
        <div className="border-t border-slate-200 px-3 pt-3 pb-4 dark:border-slate-800">
          <SimulationBody />
        </div>
      )}
    </div>
  );
}

/** Phones: a round button on the map that opens the controls in their own bottom sheet. */
export function MobileSimulationButton() {
  const { t } = useI18n();
  const { scenarios } = useAppState();
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("simTitle")}
        className="absolute start-3 top-3 z-[1000] flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg dark:bg-slate-900 dark:text-slate-200"
      >
        <SlidersHorizontal size={19} aria-hidden />
        {scenarios.length > 0 && (
          <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {scenarios.length}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[1400] flex flex-col justify-end"
          role="dialog"
          aria-modal="true"
          aria-label={t("simTitle")}
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/50"
            aria-label={t("close")}
            onClick={() => setOpen(false)}
          />
          <div className="relative max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-white px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl dark:bg-slate-900">
            <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
            <div className="mb-3 flex items-center gap-2">
              <SlidersHorizontal size={17} className="text-slate-400" aria-hidden />
              <h2 className="flex-1 text-base font-bold">{t("simTitle")}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("close")}
                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} aria-hidden />
              </button>
            </div>
            <SimulationBody onAction={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

/** Scenario toggles, demo location and the offline switch. */
function SimulationBody({ onAction }: { onAction?: () => void }) {
  const { t, pick } = useI18n();
  const {
    scenario,
    scenarios,
    toggleScenario,
    startAllScenarios,
    stopAllScenarios,
    simulatedOffline,
    setSimulatedOffline,
    setUserPos,
    inZone,
    requestFocus,
  } = useAppState();
  const allOn = scenarios.length === SCENARIOS.length;

  function locateMe() {
    navigator.geolocation?.getCurrentPosition((p) => {
      setUserPos([p.coords.latitude, p.coords.longitude]);
      requestFocus();
    });
    onAction?.();
  }

  return (
    <div className="space-y-4 text-sm">
      <div className="space-y-1.5">
        {SCENARIOS.map((s) => {
          const active = scenarios.some((a) => a.id === s.id);
          return (
            <button
              type="button"
              key={s.id}
              onClick={() => toggleScenario(s.id)}
              aria-pressed={active}
              className={`flex min-h-11 w-full items-center gap-2.5 rounded-xl border p-2 text-start transition ${
                active
                  ? "border-red-300 bg-red-50 dark:border-red-500/40 dark:bg-red-500/10"
                  : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <HazardTile hazard={s.hazard} size="sm" />
              <span className={`flex-1 leading-tight ${active ? "font-semibold text-red-700 dark:text-red-300" : ""}`}>
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
        <Button
          variant={allOn ? "outline" : "danger"}
          icon={allOn ? Square : Layers}
          onClick={allOn ? stopAllScenarios : startAllScenarios}
          className="mt-1 w-full md:h-8 md:text-xs"
        >
          {allOn ? t("simStopAll") : t("simRunAll")}
        </Button>
      </div>

      <div className="space-y-2 px-1">
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t("simLocation")}</div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            icon={MapPin}
            disabled={!scenario || inZone}
            onClick={() => {
              if (scenario) setUserPos(zoneSamplePoint(scenario.zone));
              onAction?.();
            }}
            className="h-auto min-h-11 py-1.5 whitespace-normal md:min-h-8"
          >
            {t("simMoveInto")}
          </Button>
          <Button
            size="sm"
            icon={LocateFixed}
            onClick={locateMe}
            className="h-auto min-h-11 py-1.5 whitespace-normal md:min-h-8"
          >
            {t("simUseGps")}
          </Button>
        </div>
      </div>

      <label className="flex min-h-11 cursor-pointer items-center justify-between gap-2 px-1">
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
  );
}
