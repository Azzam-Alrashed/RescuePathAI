"use client";

import { Minus, Plus } from "lucide-react";
import { AFFECTED_ICON } from "@/components/icons";
import { AFFECTED_GROUPS, totalAffected } from "@/lib/affected";
import { useI18n } from "@/lib/i18n";
import type { AffectedCounts } from "@/lib/types";

const MAX_PER_GROUP = 99;

/** Counts per affected group with −/+ steppers and a live total. */
export function AffectedCounter({
  value,
  onChange,
}: {
  value: AffectedCounts;
  onChange: (next: AffectedCounts) => void;
}) {
  const { t, formatNumber } = useI18n();
  const total = totalAffected(value);

  return (
    <div>
      <ul className="grid gap-1.5">
        {AFFECTED_GROUPS.map((g) => {
          const Icon = AFFECTED_ICON[g];
          const n = value[g];
          const label = t(`group_${g}`);
          return (
            <li
              key={g}
              className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 transition ${
                n > 0
                  ? g === "trapped"
                    ? "border-red-300 bg-red-50 dark:border-red-500/40 dark:bg-red-500/10"
                    : "border-sky-300 bg-sky-50 dark:border-sky-500/40 dark:bg-sky-500/10"
                  : "border-slate-200 dark:border-slate-700"
              }`}
            >
              <Icon
                size={17}
                className={n > 0 ? (g === "trapped" ? "text-red-600" : "text-sky-600") : "text-slate-400"}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{label}</span>
              <div className="flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => onChange({ ...value, [g]: Math.max(0, n - 1) })}
                  disabled={n <= 0}
                  className="flex h-10 w-10 items-center justify-center rounded-md md:h-8 md:w-8 bg-white shadow-sm transition disabled:opacity-40 dark:bg-slate-900"
                  aria-label={`${t("decrease")} ${label}`}
                >
                  <Minus size={14} aria-hidden />
                </button>
                <span className="w-8 text-center text-base font-bold md:text-sm tabular-nums" aria-live="polite">
                  {formatNumber(n)}
                </span>
                <button
                  type="button"
                  onClick={() => onChange({ ...value, [g]: Math.min(MAX_PER_GROUP, n + 1) })}
                  disabled={n >= MAX_PER_GROUP}
                  className="flex h-10 w-10 items-center justify-center rounded-md md:h-8 md:w-8 bg-white shadow-sm transition disabled:opacity-40 dark:bg-slate-900"
                  aria-label={`${t("increase")} ${label}`}
                >
                  <Plus size={14} aria-hidden />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex items-center justify-between rounded-xl bg-brand-navy px-3 py-2 text-white dark:bg-slate-800">
        <span className="text-sm font-semibold">{t("affectedTotal")}</span>
        <span className="text-xl font-bold tabular-nums" aria-live="polite">
          {formatNumber(total)}
        </span>
      </div>
    </div>
  );
}
