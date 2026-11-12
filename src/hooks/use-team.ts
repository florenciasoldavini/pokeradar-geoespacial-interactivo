"use client";

import { useCallback } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { isPokemonType, type PokemonType } from "@/lib/pokemon-types";
import type { PokemonSummary } from "@/lib/spawn";

export const TEAM_SIZE = 6;

export type TeamMember = {
  id: number;
  name: string;
  sprite: string;
  types: PokemonType[];
  /** Where it was caught, so the radar can take you back there. */
  zoneId: string;
};

const EMPTY_TEAM: TeamMember[] = [];

function isTeam(value: unknown): value is TeamMember[] {
  return (
    Array.isArray(value) &&
    value.length <= TEAM_SIZE &&
    value.every(
      (member: unknown) =>
        typeof member === "object" &&
        member !== null &&
        "id" in member &&
        typeof member.id === "number" &&
        "name" in member &&
        typeof member.name === "string" &&
        "sprite" in member &&
        typeof member.sprite === "string" &&
        "zoneId" in member &&
        typeof member.zoneId === "string" &&
        "types" in member &&
        Array.isArray(member.types) &&
        member.types.every((type: unknown) => typeof type === "string" && isPokemonType(type)),
    )
  );
}

export function useTeam() {
  const [team, setTeam] = useLocalStorage("pokeradar:team", EMPTY_TEAM, isTeam);

  const catchPokemon = useCallback(
    (pokemon: PokemonSummary, zoneId: string) =>
      setTeam((current) =>
        current.length >= TEAM_SIZE || current.some((m) => m.id === pokemon.id)
          ? current
          : [
              ...current,
              {
                id: pokemon.id,
                name: pokemon.name,
                sprite: pokemon.sprite,
                types: pokemon.types,
                zoneId,
              },
            ],
      ),
    [setTeam],
  );

  const release = useCallback(
    (id: number) => setTeam((current) => current.filter((m) => m.id !== id)),
    [setTeam],
  );

  return { team, catchPokemon, release, isFull: team.length >= TEAM_SIZE };
}
