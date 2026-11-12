"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

// Same-tab writes don't fire "storage" events, so we notify ourselves too.
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null; // Storage blocked (private mode, sandboxed iframe…)
  }
}

/**
 * Persistent state backed by localStorage. Uses useSyncExternalStore so the
 * server render (no storage) and hydration agree, then the stored value takes
 * over. `isValid` guards against stale or hand-edited data.
 */
export function useLocalStorage<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
): [T, (update: (previous: T) => T) => void] {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );

  const value = useMemo(() => parse(raw, fallback, isValid), [raw, fallback, isValid]);

  const setValue = useCallback(
    (update: (previous: T) => T) => {
      const next = update(parse(read(key), fallback, isValid));
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Not persisted, but there's nothing useful to tell the user.
      }
      for (const listener of listeners) listener();
    },
    [key, fallback, isValid],
  );

  return [value, setValue];
}

function parse<T>(
  raw: string | null,
  fallback: T,
  isValid: (value: unknown) => value is T,
): T {
  if (raw === null) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}
