"use client";

import { CircleCheck, Siren } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { affected } from "@/lib/affected";
import { useI18n } from "@/lib/i18n";
import { useAppState } from "@/lib/store";

const HOLD_MS = 1500;

/** One-tap (press-and-hold) SOS with the current location, for people who can't type or talk. */
export function QuickSos({ onSent }: { onSent: () => void }) {
  const { t } = useI18n();
  const { userPos, submitSos } = useAppState();
  const [holding, setHolding] = useState(false);
  const [sent, setSent] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  function begin() {
    if (timer.current || sent) return;
    setHolding(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      setHolding(false);
      setSent(true);
      submitSos({
        hazard: "unknown",
        description: t("quickSosDescription"),
        affected: affected({ adults: 1 }),
        shareVulnerable: false,
        position: userPos,
        channel: "sos",
      });
      navigator.vibrate?.(200);
      setTimeout(onSent, 1200);
    }, HOLD_MS);
  }

  function cancel() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  }

  return (
    <section className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 p-4 text-white shadow-lg shadow-red-600/25">
      <button
        type="button"
        onPointerDown={begin}
        onPointerUp={cancel}
        onPointerLeave={cancel}
        onPointerCancel={cancel}
        onKeyDown={(e) => (e.key === " " || e.key === "Enter") && !e.repeat && (e.preventDefault(), begin())}
        onKeyUp={cancel}
        onContextMenu={(e) => e.preventDefault()}
        aria-label={`${t("quickSosTitle")} – ${t("quickSosHold")}`}
        className={`relative flex h-24 w-24 shrink-0 touch-none items-center justify-center rounded-full bg-white text-red-600 shadow-xl transition select-none ${
          holding ? "rpa-holding scale-95" : ""
        }`}
        style={{ "--hold-ms": `${HOLD_MS}ms` } as React.CSSProperties}
      >
        <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
          <circle cx="50" cy="50" r="46" fill="none" stroke="#fecaca" strokeWidth="6" />
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="#dc2626"
            strokeWidth="6"
            strokeLinecap="round"
            className="rpa-hold-ring"
          />
        </svg>
        {sent ? (
          <CircleCheck size={40} aria-hidden />
        ) : (
          <span className="flex flex-col items-center">
            <Siren size={30} aria-hidden />
            <span className="text-lg leading-none font-black tracking-wider">SOS</span>
          </span>
        )}
      </button>
      <div className="min-w-0" aria-live="polite">
        <h2 className="text-lg font-bold">{sent ? t("quickSosSent") : t("quickSosTitle")}</h2>
        {!sent && <p className="mt-0.5 text-sm font-semibold opacity-95">{t("quickSosHold")}</p>}
        <p className="mt-1 text-xs leading-relaxed opacity-85">{t("quickSosHint")}</p>
      </div>
    </section>
  );
}
