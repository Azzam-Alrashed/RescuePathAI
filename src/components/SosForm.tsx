"use client";

import { useState } from "react";
import { HAZARD_ICONS, HAZARD_LABELS, useI18n } from "@/lib/i18n";
import { useAppState } from "@/lib/store";
import type { HazardType, SosInput, VulnerableFlags } from "@/lib/types";

const HAZARD_OPTIONS: (HazardType | "unknown")[] = ["trapped", "flood", "fire", "missile", "road", "unknown"];

export function SosForm({ onSent }: { onSent: () => void }) {
  const { t, pick, formatNumber } = useI18n();
  const { userPos, submitSos, offline, scenario } = useAppState();

  const [hazard, setHazard] = useState<HazardType | "unknown">(scenario?.hazard ?? "unknown");
  const [description, setDescription] = useState("");
  const [peopleCount, setPeopleCount] = useState(1);
  const [vulnerable, setVulnerable] = useState<VulnerableFlags>({ children: false, elderly: false, disabled: false });
  const [shareVulnerable, setShareVulnerable] = useState(false);
  const [queuedNotice, setQueuedNotice] = useState(false);

  const hasVulnerable = Object.values(vulnerable).some(Boolean);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input: SosInput = {
      hazard,
      description: description.trim(),
      peopleCount,
      vulnerable,
      shareVulnerable: hasVulnerable && shareVulnerable,
      position: userPos,
    };
    submitSos(input);
    setDescription("");
    if (offline) setQueuedNotice(true);
    else onSent();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h3 className="text-lg font-bold">🆘 {t("sosTitle")}</h3>

      {queuedNotice && offline && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          ⏳ {t("sosQueued")}
        </p>
      )}

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">{t("sosHazard")}</legend>
        <div className="grid grid-cols-3 gap-2">
          {HAZARD_OPTIONS.map((h) => (
            <button
              type="button"
              key={h}
              onClick={() => setHazard(h)}
              aria-pressed={hazard === h}
              className={`rounded-lg border p-2 text-xs leading-tight transition ${
                hazard === h
                  ? "border-red-600 bg-red-50 font-semibold text-red-700 dark:bg-red-950 dark:text-red-300"
                  : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              }`}
            >
              <div className="text-xl">{h === "unknown" ? "❓" : HAZARD_ICONS[h]}</div>
              {h === "unknown" ? t("sosUnknown") : pick(HAZARD_LABELS[h])}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold">{t("sosDescription")}</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder={t("sosDescriptionPlaceholder")}
          className="w-full rounded-lg border border-slate-300 bg-transparent p-2 text-sm focus:border-red-500 focus:outline-none dark:border-slate-600"
        />
      </label>

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">{t("sosPeople")}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPeopleCount((n) => Math.max(1, n - 1))}
            className="h-8 w-8 rounded-full border border-slate-300 dark:border-slate-600"
            aria-label="-"
          >
            −
          </button>
          <span className="w-8 text-center font-bold tabular-nums">{formatNumber(peopleCount)}</span>
          <button
            type="button"
            onClick={() => setPeopleCount((n) => Math.min(500, n + 1))}
            className="h-8 w-8 rounded-full border border-slate-300 dark:border-slate-600"
            aria-label="+"
          >
            +
          </button>
        </div>
      </div>

      <fieldset className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
        <legend className="px-1 text-sm font-semibold">{t("sosVulnerable")}</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {(["children", "elderly", "disabled"] as const).map((k) => (
            <label key={k} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={vulnerable[k]}
                onChange={(e) => setVulnerable((v) => ({ ...v, [k]: e.target.checked }))}
                className="accent-red-600"
              />
              {t(k)}
            </label>
          ))}
        </div>
        {hasVulnerable && (
          <label className="mt-3 flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={shareVulnerable}
              onChange={(e) => setShareVulnerable(e.target.checked)}
              className="mt-0.5 accent-red-600"
            />
            {t("sosConsent")}
          </label>
        )}
      </fieldset>

      <div className="text-xs text-slate-500 dark:text-slate-400">
        📍 {t("sosLocation")}:{" "}
        <span dir="ltr" className="tabular-nums">
          {userPos[0].toFixed(4)}, {userPos[1].toFixed(4)}
        </span>
        <br />
        {t("sosLocationHint")}
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-red-600 py-3 text-lg font-bold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-700 active:scale-[0.99]"
      >
        {t("sosSend")}
      </button>
    </form>
  );
}
