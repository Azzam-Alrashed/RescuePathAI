"use client";

import { useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

export type SheetSnap = "peek" | "half" | "full";

/** Share of the available height at each snap point. */
const SNAP: Record<SheetSnap, number> = { peek: 0.3, half: 0.55, full: 0.92 };
const TAP_SLOP_PX = 6;

/**
 * On phones, a panel that sits under the map and can be dragged between three
 * heights (or tapped to toggle half/full). From `md` up it is a plain sidebar.
 */
export function BottomSheet({
  snap,
  onSnap,
  className = "",
  children,
}: {
  snap: SheetSnap;
  onSnap: (s: SheetSnap) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLElement>(null);
  const drag = useRef<{ startY: number; startH: number; area: number; moved: boolean } | null>(null);
  const [dragPx, setDragPx] = useState<number | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    const sheet = ref.current;
    const area = sheet?.parentElement?.clientHeight;
    if (!sheet || !area) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startY: e.clientY, startH: sheet.getBoundingClientRect().height, area, moved: false };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dy = e.clientY - d.startY;
    if (Math.abs(dy) > TAP_SLOP_PX) d.moved = true;
    if (d.moved) setDragPx(Math.max(d.area * 0.15, Math.min(d.area * SNAP.full, d.startH - dy)));
  }

  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (!d.moved) {
      onSnap(snap === "full" ? "half" : "full");
    } else if (dragPx !== null) {
      const share = dragPx / d.area;
      const nearest = (Object.keys(SNAP) as SheetSnap[]).reduce((a, b) =>
        Math.abs(SNAP[b] - share) < Math.abs(SNAP[a] - share) ? b : a,
      );
      onSnap(nearest);
    }
    setDragPx(null);
  }

  return (
    <section
      ref={ref}
      style={{ "--sheet-h": dragPx !== null ? `${dragPx}px` : `${SNAP[snap] * 100}%` } as React.CSSProperties}
      className={`relative z-[1000] -mt-4 flex h-(--sheet-h) shrink-0 flex-col rounded-t-3xl bg-slate-50 shadow-[0_-8px_24px_rgb(15_23_42/0.18)] md:mt-0 md:h-auto md:rounded-none md:shadow-none dark:bg-slate-950 ${
        dragPx === null ? "transition-[height] duration-300 ease-out" : "select-none"
      } ${className}`}
    >
      <button
        type="button"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        aria-label={t("sheetHandle")}
        className="flex h-6 w-full shrink-0 touch-none items-center justify-center md:hidden"
      >
        <span className="h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
      </button>
      {children}
    </section>
  );
}
