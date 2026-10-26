"use client";

import { LoaderCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/** Placeholder while the (client-only) map loads: a faint street grid and a spinner. */
export function MapSkeleton() {
  const { t } = useI18n();
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-slate-200 dark:bg-slate-800">
      <div
        aria-hidden
        className="absolute inset-0 animate-pulse opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgb(148 163 184 / 0.35) 1px, transparent 1px), linear-gradient(to bottom, rgb(148 163 184 / 0.35) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <span className="relative flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow dark:bg-slate-900/90 dark:text-slate-300">
        <LoaderCircle size={14} className="animate-spin" aria-hidden />
        {t("loadingMap")}
      </span>
    </div>
  );
}
