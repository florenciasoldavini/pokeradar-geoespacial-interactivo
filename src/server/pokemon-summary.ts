import "server-only";
import { formatSlug } from "@/lib/format";
import { fetchPokeApi } from "@/lib/pokeapi/fetch";
import type { ApiPokemon } from "@/lib/pokeapi/types";
import { isPokemonType } from "@/lib/pokemon-types";
import type { PokemonSummary } from "@/lib/spawn";

/**
 * Fetches a Pokémon and keeps only what the map needs. `displayName` lets
 * callers pass the species name ("deoxys") instead of the form ("deoxys-normal").
 */
export async function fetchPokemonSummary(
  id: number,
  displayName?: string,
): Promise<PokemonSummary> {
  const pokemon = await fetchPokeApi<ApiPokemon>(`/pokemon/${id}`);
  return {
    id: pokemon.id,
    name: formatSlug(displayName ?? pokemon.name),
    types: pokemon.types
      .toSorted((a, b) => a.slot - b.slot)
      .map(({ type }) => type.name)
      .filter(isPokemonType),
    sprite:
      pokemon.sprites.other.showdown.front_default ??
      pokemon.sprites.front_default ??
      "",
    cry: pokemon.cries.latest ?? pokemon.cries.legacy,
    statTotal: pokemon.stats.reduce((sum, stat) => sum + stat.base_stat, 0),
  };
}
