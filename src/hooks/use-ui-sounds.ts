"use client";

import { useEffect, useRef } from "react";
import { sfx } from "@/lib/sfx";

type UiState = {
  zoneId: string | null;
  pokemonId: number | null;
  /** A side panel or the manual is open. */
  panelOpen: boolean;
};

/**
 * Device sounds driven by what changed, not by what was clicked, so
 * keyboard shortcuts sound the same as clicks: a ping for a zone, an
 * arpeggio for a Pokémon, a sweep up or down for panels opening or
 * closing. Any other button ticks. Off whenever the sound key is muted.
 */
export function useUiSounds(enabled: boolean, state: UiState) {
  const previous = useRef(state);
  /** No sound before the first gesture (e.g. the manual opening by itself). */
  const armed = useRef(false);
  const { zoneId, pokemonId, panelOpen } = state;

  useEffect(() => {
    function arm() {
      armed.current = true;
    }
    window.addEventListener("pointerdown", arm, { capture: true, once: true });
    window.addEventListener("keydown", arm, { capture: true, once: true });
    return () => {
      window.removeEventListener("pointerdown", arm, { capture: true });
      window.removeEventListener("keydown", arm, { capture: true });
    };
  }, []);

  useEffect(() => {
    const before = previous.current;
    previous.current = { zoneId, pokemonId, panelOpen };
    if (!enabled || !armed.current) return;
    // One sound per change, the most specific first.
    if (pokemonId !== null && pokemonId !== before.pokemonId) sfx.pokemon();
    else if (zoneId !== null && zoneId !== before.zoneId) sfx.zone();
    else if (panelOpen && !before.panelOpen) sfx.open();
    else if (
      (!panelOpen && before.panelOpen) ||
      (pokemonId === null && before.pokemonId !== null) ||
      (zoneId === null && before.zoneId !== null)
    )
      sfx.close();
  }, [enabled, zoneId, pokemonId, panelOpen]);

  useEffect(() => {
    if (!enabled) return;
    function onClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      const control = event.target.closest("button, select, a");
      if (control && !control.matches(":disabled")) sfx.press();
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [enabled]);
}
