"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Press-and-hold handlers: `onComplete` fires after holding for `ms`; a
 * shorter press counts as a tap. Works with touch, mouse and Space/Enter.
 */
export function useHold({ ms, onComplete, onTap }: { ms: number; onComplete: () => void; onTap?: () => void }) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const done = useRef(false);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  function begin() {
    if (timer.current) return;
    done.current = false;
    setHolding(true);
    navigator.vibrate?.(15);
    timer.current = setTimeout(() => {
      timer.current = null;
      done.current = true;
      setHolding(false);
      navigator.vibrate?.([200, 100, 200]);
      onComplete();
    }, ms);
  }

  /** Released: a tap if the hold didn't complete, unless the pointer left. */
  function end(asTap: boolean) {
    if (!timer.current) return;
    clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
    if (asTap && !done.current) onTap?.();
  }

  return {
    holding,
    handlers: {
      onPointerDown: begin,
      onPointerUp: () => end(true),
      onPointerLeave: () => end(false),
      onPointerCancel: () => end(false),
      onKeyDown: (e: React.KeyboardEvent) => {
        if ((e.key === " " || e.key === "Enter") && !e.repeat) {
          e.preventDefault();
          begin();
        }
      },
      onKeyUp: () => end(true),
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    },
  };
}
