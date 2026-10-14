import { useSyncExternalStore } from "react";

/**
 * A tiny localStorage-backed store for useSyncExternalStore. Keeps an in-memory
 * copy so it still works when storage is unavailable (private mode, blocked).
 */
export function createPersistentStore<T>(key: string, fallback: T, parse: (raw: string) => T) {
  const listeners = new Set<() => void>();
  let value: T | undefined;

  function get(): T {
    if (value === undefined) {
      value = fallback;
      try {
        const raw = localStorage.getItem(key);
        if (raw !== null) value = parse(raw);
      } catch {}
    }
    return value;
  }

  function set(next: T | ((prev: T) => T)) {
    value = typeof next === "function" ? (next as (prev: T) => T)(get()) : next;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
    listeners.forEach((l) => l());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function useValue(): T {
    return useSyncExternalStore(subscribe, get, () => fallback);
  }

  return { get, set, useValue };
}

function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

export function useBrowserOnline(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
}
