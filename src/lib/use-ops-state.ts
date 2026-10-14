"use client";

import { useCallback, useEffect, useState } from "react";
import type { CaseAction, OpsState } from "@/lib/types";

const POLL_MS = 3000;

/** Live operations picture for the dashboard, polled from the server. */
export function useOpsState() {
  const [state, setState] = useState<OpsState | null>(null);
  const [connected, setConnected] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Clock for "x min ago" labels, advanced on every poll.
  const [now, setNow] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/ops", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setState(await res.json());
      setConnected(true);
    } catch {
      setConnected(false);
    }
    setNow(Date.now());
  }, []);

  // Poll in sequence (never overlapping), starting right away.
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      await refresh();
      if (!stopped) timer = setTimeout(tick, POLL_MS);
    };
    timer = setTimeout(tick, 0);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [refresh]);

  const send = useCallback(async (url: string, init: RequestInit) => {
    try {
      const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } });
      const body = await res.json();
      if (res.ok) {
        setState(body);
        setError(null);
      } else {
        setError(body.error ?? `HTTP ${res.status}`);
        if (body.state) setState(body.state);
      }
    } catch {
      setConnected(false);
    }
    setNow(Date.now());
  }, []);

  const act = useCallback(
    (caseId: string, action: CaseAction) =>
      send(`/api/ops/cases/${encodeURIComponent(caseId)}`, { method: "PATCH", body: JSON.stringify(action) }),
    [send],
  );

  const reset = useCallback(() => send("/api/ops/reset", { method: "POST" }), [send]);

  return { state, connected, error, now, act, reset };
}
