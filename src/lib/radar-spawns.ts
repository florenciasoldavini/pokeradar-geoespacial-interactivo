import { hashString, seededRandom, shuffled } from "@/lib/random";
import type { RadarSpawn, Spawn, WeatherVisitors } from "@/lib/spawn";
import { spawnPosition } from "@/lib/spawn-layout";
import { isBoosted, type ZoneWeather } from "@/lib/weather";
import type { Zone } from "@/lib/zones";

/**
 * Applies the zone's live weather to its habitat roster. Weather only ever
 * adds — a boost on matching types and one weather-exclusive visitor — so
 * nothing on the map jumps when the forecast arrives after the page loads.
 */
export function applyWeather(
  zone: Zone,
  spawns: readonly Spawn[],
  weather: ZoneWeather | null,
  visitors: WeatherVisitors,
): RadarSpawn[] {
  const kind = weather?.kind ?? null;
  const result: RadarSpawn[] = spawns.map((spawn) => ({
    ...spawn,
    boostedBy: kind && isBoosted(spawn.types, kind) ? kind : null,
    isVisitor: false,
  }));
  if (!kind || spawns.length === 0) return result;

  // Seeded per zone + weather: a rainy Iguazú always gets the same visitor,
  // and it never duplicates a Pokémon already living there.
  const random = seededRandom(hashString(`${zone.id}:${kind}`));
  const residents = new Set(spawns.map((spawn) => spawn.id));
  const visitor = shuffled(visitors[kind], random).find(
    (candidate) => !residents.has(candidate.id),
  );
  if (visitor) {
    result.push({
      ...visitor,
      position: spawnPosition(zone, spawns.length, spawns.length + 1, random),
      boostedBy: kind,
      isVisitor: true,
    });
  }
  return result;
}
