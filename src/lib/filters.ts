import { generationOf, type PokemonType } from "@/lib/pokemon-types";
import type { PokemonSummary } from "@/lib/spawn";

export type Generation = 1 | 2 | 3;

export const GENERATIONS: { value: Generation; label: string; region: string }[] = [
  { value: 1, label: "I", region: "Kanto" },
  { value: 2, label: "II", region: "Johto" },
  { value: 3, label: "III", region: "Hoenn" },
];

/** Base stat totals in Gen I–III run from 180 (Sunkern) to 680 (Mewtwo…). */
export const STAT_TOTAL_BOUNDS = { min: 150, max: 700, step: 10 } as const;

export type RadarFilters = {
  /** Empty = every type. */
  types: readonly PokemonType[];
  /** Empty = every generation. */
  generations: readonly Generation[];
  statTotal: readonly [min: number, max: number];
};

export const DEFAULT_FILTERS: RadarFilters = {
  types: [],
  generations: [],
  statTotal: [STAT_TOTAL_BOUNDS.min, STAT_TOTAL_BOUNDS.max],
};

export function matchesFilters(pokemon: PokemonSummary, filters: RadarFilters) {
  const [min, max] = filters.statTotal;
  return (
    (filters.types.length === 0 ||
      pokemon.types.some((type) => filters.types.includes(type))) &&
    (filters.generations.length === 0 ||
      filters.generations.includes(generationOf(pokemon.id))) &&
    pokemon.statTotal >= min &&
    pokemon.statTotal <= max
  );
}

export function activeFilterCount(filters: RadarFilters): number {
  const [min, max] = filters.statTotal;
  const statsActive = min > STAT_TOTAL_BOUNDS.min || max < STAT_TOTAL_BOUNDS.max;
  return filters.types.length + filters.generations.length + (statsActive ? 1 : 0);
}

/** Adds the value if missing, removes it if present. */
export function toggled<T>(values: readonly T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}
