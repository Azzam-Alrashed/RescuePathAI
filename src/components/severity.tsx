"use client";

import { SEVERITY_LABELS, useI18n } from "@/lib/i18n";
import type { Severity } from "@/lib/types";

export const SEVERITY_COLOR: Record<Severity, string> = {
  low: "#16a34a",
  medium: "#ca8a04",
  high: "#ea580c",
  critical: "#dc2626",
};

export const SEVERITY_BADGE: Record<Severity, string> = {
  low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300",
  critical: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
};

export function SeverityDot({ severity, className = "" }: { severity: Severity; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${severity === "critical" ? "animate-pulse" : ""} ${className}`}
      style={{ backgroundColor: SEVERITY_COLOR[severity] }}
    />
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const { pick } = useI18n();
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${SEVERITY_BADGE[severity]}`}
    >
      <SeverityDot severity={severity} />
      {pick(SEVERITY_LABELS[severity])}
    </span>
  );
}
