import { POKEMON_TYPES, type PokemonType } from "@/lib/pokemon-types";

/**
 * Attacking type → defending types it doesn't hit for ×1 (Gen VI+ chart).
 * Only the exceptions are listed; anything missing is neutral.
 */
const CHART: Record<PokemonType, Partial<Record<PokemonType, number>>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

type MatchupGroup = {
  multiplier: number;
  label: string;
  types: PokemonType[];
};

/** Display order: the scariest first. */
const GROUPS: readonly { multiplier: number; label: string }[] = [
  { multiplier: 4, label: "Muy débil" },
  { multiplier: 2, label: "Débil" },
  { multiplier: 0.5, label: "Resiste" },
  { multiplier: 0.25, label: "Muy resistente" },
  { multiplier: 0, label: "Inmune" },
];

/** How much damage each attacking type deals to this type combination. */
export function defensiveMatchups(types: readonly PokemonType[]): MatchupGroup[] {
  const byMultiplier = new Map<number, PokemonType[]>();
  for (const attacker of POKEMON_TYPES) {
    const multiplier = types.reduce(
      (product, defender) => product * (CHART[attacker][defender] ?? 1),
      1,
    );
    if (multiplier === 1) continue;
    byMultiplier.set(multiplier, [...(byMultiplier.get(multiplier) ?? []), attacker]);
  }
  return GROUPS.flatMap((group) => {
    const matching = byMultiplier.get(group.multiplier);
    return matching ? [{ ...group, types: matching }] : [];
  });
}
