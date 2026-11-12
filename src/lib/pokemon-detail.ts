import { formatSlug } from "@/lib/format";
import { fetchPokeApi } from "@/lib/pokeapi/fetch";
import type { ApiPokemon, ApiPokemonSpecies } from "@/lib/pokeapi/types";
import { isPokemonType, type PokemonType } from "@/lib/pokemon-types";

export const STAT_LABELS = {
  hp: "PS",
  attack: "Ataque",
  defense: "Defensa",
  "special-attack": "At. Esp.",
  "special-defense": "Def. Esp.",
  speed: "Velocidad",
} as const;

export type StatName = keyof typeof STAT_LABELS;

/** What the detail panel renders, already localized to Spanish. */
export type PokemonDetail = {
  id: number;
  name: string;
  genus: string | null;
  description: string | null;
  types: PokemonType[];
  artwork: string | null;
  cry: string | null;
  heightM: number;
  weightKg: number;
  abilities: { name: string; hidden: boolean }[];
  stats: { name: StatName; value: number }[];
  isLegendary: boolean;
  isMythical: boolean;
};

function isStatName(value: string): value is StatName {
  return value in STAT_LABELS;
}

function spanish<T extends { language: { name: string } }>(
  entries: T[],
): T | undefined {
  // Last entry = most recent game version.
  return entries.findLast((entry) => entry.language.name === "es");
}

export async function fetchPokemonDetail(
  id: number,
  signal?: AbortSignal,
): Promise<PokemonDetail> {
  const [pokemon, species] = await Promise.all([
    fetchPokeApi<ApiPokemon>(`/pokemon/${id}`, { signal }),
    fetchPokeApi<ApiPokemonSpecies>(`/pokemon-species/${id}`, { signal }),
  ]);

  return {
    id: pokemon.id,
    name: spanish(species.names)?.name ?? formatSlug(pokemon.name),
    genus: spanish(species.genera)?.genus ?? null,
    // Flavor texts come with hard line breaks and form feeds from the games.
    description:
      spanish(species.flavor_text_entries)?.flavor_text.replace(/\s+/g, " ") ??
      null,
    types: pokemon.types
      .toSorted((a, b) => a.slot - b.slot)
      .map(({ type }) => type.name)
      .filter(isPokemonType),
    artwork:
      pokemon.sprites.other["official-artwork"].front_default ??
      pokemon.sprites.front_default,
    cry: pokemon.cries.latest ?? pokemon.cries.legacy,
    heightM: pokemon.height / 10,
    weightKg: pokemon.weight / 10,
    abilities: pokemon.abilities
      .toSorted((a, b) => a.slot - b.slot)
      .map(({ ability, is_hidden }) => ({
        name: formatSlug(ability.name),
        hidden: is_hidden,
      })),
    stats: pokemon.stats.flatMap(({ stat, base_stat }) =>
      isStatName(stat.name) ? [{ name: stat.name, value: base_stat }] : [],
    ),
    isLegendary: species.is_legendary,
    isMythical: species.is_mythical,
  };
}
