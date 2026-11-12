import { RadarApp } from "@/components/radar/radar-app";
import { ZONES } from "@/lib/zones";
import { getZoneSpawns } from "@/server/spawns";
import { getWeatherVisitors } from "@/server/weather-visitors";

/**
 * Server Component: builds the habitat rosters and the weather-visitor pool
 * (both cached for a day) and hands plain data to the interactive client
 * tree. Live weather is read on the client, where it can refresh. No map code
 * runs here.
 */
export default async function Home() {
  const [spawnsByZone, weatherVisitors] = await Promise.all([
    getZoneSpawns(),
    getWeatherVisitors(),
  ]);
  return (
    <RadarApp
      zones={ZONES}
      spawnsByZone={spawnsByZone}
      weatherVisitors={weatherVisitors}
    />
  );
}
