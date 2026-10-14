import type { Locale } from "@/lib/types";

export function timeAgo(ts: number, now: number, locale: Locale): string {
  const mins = Math.round((now - ts) / 60_000);
  const rtf = new Intl.RelativeTimeFormat(locale === "ar" ? "ar-SA" : "en-US", { numeric: "auto" });
  return mins < 60 ? rtf.format(-Math.max(0, mins), "minute") : rtf.format(-Math.round(mins / 60), "hour");
}

export const etaMinutes = (etaS: number) => Math.max(1, Math.round(etaS / 60));
