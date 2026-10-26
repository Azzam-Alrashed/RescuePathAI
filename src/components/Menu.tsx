"use client";

import { EllipsisVertical, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type MenuItem = { label: string; icon: LucideIcon } & ({ href: string } | { onSelect: () => void });

/** A "⋮" button with a small dropdown of actions, for crowded headers on phones. */
export function Menu({ label, items, className = "" }: { label: string; items: MenuItem[]; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const itemClass =
    "flex w-full items-center gap-3 px-4 py-3 text-start text-sm font-medium text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800";

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 text-white transition hover:bg-white/10"
      >
        <EllipsisVertical size={18} aria-hidden />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute end-0 top-full z-[1300] mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-900"
        >
          {items.map((item) => {
            const Icon = item.icon;
            const content = (
              <>
                <Icon size={17} className="text-slate-400" aria-hidden />
                {item.label}
              </>
            );
            return "href" in item ? (
              <Link key={item.label} href={item.href} role="menuitem" className={itemClass}>
                {content}
              </Link>
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={itemClass}
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
