"use client";

import { useEffect, useRef } from "react";

/**
 * Moves keyboard focus into a panel when it mounts and hands it back to
 * whatever opened it (a marker, a key) when it closes, so focus never
 * drops to <body>. Pass `focusOnMount: false` when the panel focuses a
 * control of its own (e.g. with autoFocus).
 */
export function useFocusHandoff<T extends HTMLElement>({ focusOnMount = true } = {}) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const node = ref.current;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (focusOnMount) node?.focus({ preventScroll: true });
    return () => {
      const active = document.activeElement;
      const lost = active === null || active === document.body || (node?.contains(active) ?? false);
      if (lost && opener?.isConnected && !node?.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, [focusOnMount]);
  return ref;
}
