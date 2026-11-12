"use client";

import { useSyncExternalStore } from "react";
import { getPlayingCry, subscribeCry } from "@/lib/cry-player";

/** Id of the Pokémon whose cry is playing right now, if any. */
export function usePlayingCry(): number | null {
  return useSyncExternalStore(subscribeCry, getPlayingCry, () => null);
}
