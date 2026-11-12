import "server-only";
import { cacheLife } from "next/cache";
import { fetchPokeApi, idFromResourceUrl } from "@/lib/pokeapi/fetch";
import type { ApiType } from "@/lib/pokeapi/types";
import { hashString, seededRandom, shuffled } from "@/lib/random";
import type { PokemonSummary, WeatherVisitors } from "@/lib/spawn";
import { WEATHER_KINDS, WEATHER_META, type WeatherKind } from "@/lib/weather";
import { fetchPokemonSummary } from "@/server/pokemon-summary";

const CANDIDATES_PER_WEATHER = 6;
/** Habitat data stops at Gen III; keep visitors in the same era. */
const MAX_POKEMON_ID = 386;

/**
 * For every weather kind, a few Pokémon of its boosted types that can show up
 * in any zone while that weather is live. The live weather itself is read on
 * the client; this pool is static enough to cache for a day.
 */
export async function getWeatherVisitors(): Promise<WeatherVisitors> {
  "use cache";
  cacheLife("days");

  const entries = await Promise.all(
    WEATHER_KINDS.map(async (kind): Promise<[WeatherKind, PokemonSummary[]]> => {
      try {
        return [kind, await getCandidates(kind)];
      } catch (error) {
        console.error(`No se pudieron cargar visitantes para ${kind}`, error);
        return [kind, []];
      }
    }),
  );
  return Object.fromEntries(entries) as WeatherVisitors;
}

async function getCandidates(kind: WeatherKind): Promise<PokemonSummary[]> {
  const types = await Promise.all(
    WEATHER_META[kind].boosts.map((type) => fetchPokeApi<ApiType>(`/type/${type}`)),
  );
  const ids = new Set(
    types
      .flatMap((type) => type.pokemon)
      .map(({ pokemon }) => idFromResourceUrl(pokemon.url))
      .filter((id) => id <= MAX_POKEMON_ID),
  );
  const picked = shuffled([...ids], seededRandom(hashString(kind))).slice(
    0,
    CANDIDATES_PER_WEATHER,
  );
  return Promise.all(picked.map((id) => fetchPokemonSummary(id)));
}
