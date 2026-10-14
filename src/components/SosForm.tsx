"use client";

import { Check, Hourglass, MapPin, Minus, Plus, Siren } from "lucide-react";
import { useState } from "react";
import { HAZARD_ICON, HAZARD_TONE, VULNERABLE_ICON } from "@/components/icons";
import { Button, Card } from "@/components/ui";
import { HAZARD_LABELS, useI18n } from "@/lib/i18n";
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
    <form onSubmit={submit} className="space-y-3">
      <div className="flex items-center gap-3 px-1 pt-1">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shadow-md shadow-red-600/25">
          <Siren size={20} aria-hidden />
        </span>
        <h2 className="text-lg font-bold">{t("sosTitle")}</h2>
      </div>

      {queuedNotice && offline && (
        <p className="flex gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-500/10 dark:text-amber-200">
          <Hourglass size={18} className="mt-0.5 shrink-0" aria-hidden />
          {t("sosQueued")}
        </p>
      )}

      <Card>
        <fieldset>
          <legend className="mb-3 text-sm font-bold">{t("sosHazard")}</legend>
          <div className="grid grid-cols-3 gap-2">
            {HAZARD_OPTIONS.map((h) => {
              const Icon = HAZARD_ICON[h];
              const selected = hazard === h;
              return (
                <button
                  type="button"
                  key={h}
                  onClick={() => setHazard(h)}
                  aria-pressed={selected}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-1 py-2.5 text-xs leading-tight font-medium transition ${
                    selected
                      ? "border-red-600 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"
                      : "border-transparent bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${selected ? "bg-red-600 text-white" : HAZARD_TONE[h]}`}
                  >
                    <Icon size={18} strokeWidth={2.2} aria-hidden />
                  </span>
                  {h === "unknown" ? t("sosUnknown") : pick(HAZARD_LABELS[h])}
                </button>
              );
            })}
          </div>
        </fieldset>
      </Card>

      <Card>
        <label className="block">
          <span className="mb-2 block text-sm font-bold">{t("sosDescription")}</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={2000}
            dir="auto"
            placeholder={t("sosDescriptionPlaceholder")}
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm transition placeholder:text-slate-400 focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-500/10 focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:focus:bg-slate-900"
          />
        </label>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-sm font-bold">{t("sosPeople")}</span>
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setPeopleCount((n) => Math.max(1, n - 1))}
              disabled={peopleCount <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm transition disabled:opacity-40 dark:bg-slate-900"
              aria-label={t("decrease")}
            >
              <Minus size={15} aria-hidden />
            </button>
            <span className="w-9 text-center text-base font-bold tabular-nums" aria-live="polite">
              {formatNumber(peopleCount)}
            </span>
            <button
              type="button"
              onClick={() => setPeopleCount((n) => Math.min(500, n + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm transition dark:bg-slate-900"
              aria-label={t("increase")}
            >
              <Plus size={15} aria-hidden />
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <fieldset>
          <legend className="mb-3 text-sm font-bold">{t("sosVulnerable")}</legend>
          <div className="flex flex-wrap gap-2">
            {(["children", "elderly", "disabled"] as const).map((k) => {
              const Icon = VULNERABLE_ICON[k];
              const on = vulnerable[k];
              return (
                <button
                  type="button"
                  key={k}
                  aria-pressed={on}
                  onClick={() => setVulnerable((v) => ({ ...v, [k]: !v[k] }))}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition ${
                    on
                      ? "border-sky-600 bg-sky-600 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  }`}
                >
                  {on ? <Check size={15} aria-hidden /> : <Icon size={15} aria-hidden />}
                  {t(k)}
                </button>
              );
            })}
          </div>
          {hasVulnerable && (
            <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-xl bg-sky-50 p-3 text-xs text-sky-950 dark:bg-sky-500/10 dark:text-sky-100">
              <input
                type="checkbox"
                checked={shareVulnerable}
                onChange={(e) => setShareVulnerable(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-sky-600"
              />
              {t("sosConsent")}
            </label>
          )}
        </fieldset>
      </Card>

      <div className="flex gap-2.5 px-1 text-xs text-slate-500 dark:text-slate-400">
        <MapPin size={15} className="mt-0.5 shrink-0" aria-hidden />
        <p>
          <span className="font-semibold text-slate-700 dark:text-slate-300">{t("sosLocation")}: </span>
          <span dir="ltr" className="tabular-nums">
            {userPos[0].toFixed(4)}, {userPos[1].toFixed(4)}
          </span>
          <br />
          {t("sosLocationHint")}
        </p>
      </div>

      <Button type="submit" variant="danger" size="lg" icon={Siren} className="w-full">
        {t("sosSend")}
      </Button>
    </form>
  );
}
