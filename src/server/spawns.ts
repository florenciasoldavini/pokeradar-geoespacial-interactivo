import "server-only";
import { cacheLife } from "next/cache";
import { fetchPokeApi, idFromResourceUrl } from "@/lib/pokeapi/fetch";
import type { ApiHabitat } from "@/lib/pokeapi/types";
import { hashString, seededRandom, shuffled } from "@/lib/random";
import type { Spawn, ZoneSpawns } from "@/lib/spawn";
import { spawnPosition } from "@/lib/spawn-layout";
import { ZONES, type Zone } from "@/lib/zones";
import { fetchPokemonSummary } from "@/server/pokemon-summary";

const SPAWNS_PER_ZONE = 8;

/**
 * Builds every zone's roster from its PokéAPI habitat. Cached for a day, so
 * the ~80 upstream requests happen at build/revalidation time — never while a
 * visitor waits — and the result ships inside the prerendered page.
 */
export async function getZoneSpawns(): Promise<ZoneSpawns> {
  "use cache";
  cacheLife("days");

  const entries = await Promise.all(
    ZONES.map(async (zone): Promise<[string, Spawn[]]> => {
      try {
        return [zone.id, await getSpawnsForZone(zone)];
      } catch (error) {
        // One unreachable habitat shouldn't take the whole radar down; the UI
        // shows that zone as "sin señal".
        console.error(`No se pudo cargar la zona ${zone.id}`, error);
        return [zone.id, []];
      }
    }),
  );
  // PokéAPI fully down: throw rather than cache an empty radar for a day.
  // A revalidation keeps serving the last good result; a build fails and the
  // previous deployment stays live.
  if (entries.every(([, spawns]) => spawns.length === 0)) {
    throw new Error("PokéAPI no respondió para ninguna zona");
  }
  return Object.fromEntries(entries);
}

async function getSpawnsForZone(zone: Zone): Promise<Spawn[]> {
  const habitat = await fetchPokeApi<ApiHabitat>(
    `/pokemon-habitat/${zone.habitat}`,
  );
  // Seeded by zone id: the same Pokémon always live in the same place.
  const random = seededRandom(hashString(zone.id));
  const species = shuffled(habitat.pokemon_species, random).slice(
    0,
    SPAWNS_PER_ZONE,
  );

  // allSettled: one failed species (say, a 429) costs that Pokémon, not the zone.
  const results = await Promise.allSettled(
    species.map(({ name, url }) =>
      // Species name, not the Pokémon's: "deoxys" rather than "deoxys-normal".
      fetchPokemonSummary(idFromResourceUrl(url), name),
    ),
  );
  const summaries = results.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
  if (summaries.length === 0) throw new Error(`Ningún Pokémon cargó para ${zone.id}`);

  return summaries.map((summary, index) => ({
    ...summary,
    position: spawnPosition(zone, index, summaries.length, random),
  }));
}
