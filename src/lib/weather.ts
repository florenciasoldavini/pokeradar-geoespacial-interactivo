import type { PokemonType } from "@/lib/pokemon-types";
import type { Zone } from "@/lib/zones";

export const WEATHER_KINDS = [
  "clear",
  "partly-cloudy",
  "cloudy",
  "rain",
  "snow",
  "fog",
  "windy",
] as const;

export type WeatherKind = (typeof WEATHER_KINDS)[number];

/**
 * Which types each weather boosts. Borrowed from Pokémon GO's weather boost
 * so the rule is familiar to players (and covers the brief's examples:
 * rain → Water/Electric, snow → Ice, sun → Fire).
 */
export const WEATHER_META: Record<
  WeatherKind,
  { label: string; color: string; boosts: PokemonType[] }
> = {
  clear: { label: "Despejado", color: "#fbbf24", boosts: ["fire", "grass", "ground"] },
  "partly-cloudy": { label: "Parcialmente nublado", color: "#cbd5e1", boosts: ["normal", "rock"] },
  cloudy: { label: "Nublado", color: "#94a3b8", boosts: ["fairy", "fighting", "poison"] },
  rain: { label: "Lluvia", color: "#60a5fa", boosts: ["water", "electric", "bug"] },
  snow: { label: "Nieve", color: "#e0f2fe", boosts: ["ice", "steel"] },
  fog: { label: "Niebla", color: "#a1a1aa", boosts: ["dark", "ghost"] },
  windy: { label: "Ventoso", color: "#5eead4", boosts: ["dragon", "flying", "psychic"] },
};

export type ZoneWeather = {
  kind: WeatherKind;
  temperatureC: number;
  windKmh: number;
  isDay: boolean;
};

/** Above this sustained wind, wind dominates whatever the sky looks like. */
const WINDY_THRESHOLD_KMH = 30;

/** Maps a WMO weather code (as used by Open-Meteo) + wind to a WeatherKind. */
export function classifyWeather(code: number, windKmh: number): WeatherKind {
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) {
    return "rain";
  }
  if (code === 45 || code === 48) return "fog";
  if (windKmh >= WINDY_THRESHOLD_KMH) return "windy";
  if (code <= 1) return "clear";
  if (code === 2) return "partly-cloudy";
  return "cloudy";
}

export function isBoosted(types: readonly PokemonType[], kind: WeatherKind) {
  return types.some((type) => WEATHER_META[kind].boosts.includes(type));
}

type OpenMeteoLocation = {
  current: {
    temperature_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    is_day: number;
  };
};

/**
 * Current weather for every zone in a single Open-Meteo request (it accepts
 * comma-separated coordinates and answers with one entry per location).
 */
export async function fetchZoneWeather(
  zones: readonly Zone[],
  signal?: AbortSignal,
): Promise<Record<string, ZoneWeather>> {
  const params = new URLSearchParams({
    latitude: zones.map((zone) => zone.center[1]).join(","),
    longitude: zones.map((zone) => zone.center[0]).join(","),
    current: "temperature_2m,weather_code,wind_speed_10m,is_day",
  });
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params}`,
    { signal },
  );
  if (!response.ok) throw new Error(`Open-Meteo respondió ${response.status}`);

  const body: unknown = await response.json();
  // A single location comes back as an object instead of an array.
  const locations = (Array.isArray(body) ? body : [body]) as OpenMeteoLocation[];

  return Object.fromEntries(
    zones.flatMap((zone, index) => {
      const current = locations[index]?.current;
      if (!current) return [];
      const weather: ZoneWeather = {
        kind: classifyWeather(current.weather_code, current.wind_speed_10m),
        temperatureC: Math.round(current.temperature_2m),
        windKmh: Math.round(current.wind_speed_10m),
        isDay: current.is_day === 1,
      };
      return [[zone.id, weather]];
    }),
  );
}
