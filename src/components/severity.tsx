"use client";

import { SEVERITY_LABELS, useI18n } from "@/lib/i18n";
import type { Severity } from "@/lib/types";

export const SEVERITY_COLOR: Record<Severity, string> = {
  low: "#16a34a",
  medium: "#ca8a04",
  high: "#ea580c",
  critical: "#dc2626",
};

export const SEVERITY_STYLE: Record<Severity, { dot: string; badge: string }> = {
  low: { dot: "🟢", badge: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" },
  medium: { dot: "🟡", badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300" },
  high: { dot: "🟠", badge: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300" },
  critical: { dot: "🔴", badge: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const { pick } = useI18n();
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${SEVERITY_STYLE[severity].badge}`}>
      {SEVERITY_STYLE[severity].dot} {pick(SEVERITY_LABELS[severity])}
    </span>
  );
}
