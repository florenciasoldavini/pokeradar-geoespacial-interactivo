"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchPokemonDetail, type PokemonDetail } from "@/lib/pokemon-detail";

export type DetailState =
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | { status: "success"; data: PokemonDetail };

// Reopening a Pokémon you already inspected is instant.
const cache = new Map<number, PokemonDetail>();

type Settled =
  | { id: number; attempt: number; data: PokemonDetail }
  | { id: number; attempt: number; error: true };

export function usePokemonDetail(id: number): DetailState {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled | null>(null);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    if (cache.has(id)) return;
    const controller = new AbortController();
    fetchPokemonDetail(id, controller.signal).then(
      (data) => {
        cache.set(id, data);
        setSettled({ id, attempt, data });
      },
      () => {
        if (!controller.signal.aborted) setSettled({ id, attempt, error: true });
      },
    );
    return () => controller.abort();
  }, [id, attempt]);

  const cached = cache.get(id);
  if (cached) return { status: "success", data: cached };
  // Anything settled for a previous id/attempt is stale: we're loading.
  if (!settled || settled.id !== id || settled.attempt !== attempt) {
    return { status: "loading" };
  }
  return "data" in settled
    ? { status: "success", data: settled.data }
    : { status: "error", retry };
}
