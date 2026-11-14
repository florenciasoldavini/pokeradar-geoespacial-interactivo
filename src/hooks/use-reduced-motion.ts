"use client";

import { useMediaQuery } from "@/hooks/use-media-query";

/**
 * Like framer-motion's useReducedMotion, but false on the server and during
 * hydration (then it updates), so reduced-motion users don't get a
 * hydration mismatch from markup that branches on it.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
