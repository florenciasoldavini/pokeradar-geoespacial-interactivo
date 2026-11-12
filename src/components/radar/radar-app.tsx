"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { CameraTarget } from "@/components/map/camera-controller";
import { MapLoader } from "@/components/map/map-loader";
import { PokemonDrawer, type TeamStatus } from "@/components/pokemon/pokemon-drawer";
import { FilterPanel } from "@/components/radar/filter-panel";
import { SoundToggle } from "@/components/radar/sound-toggle";
import { TeamDock } from "@/components/radar/team-dock";
import { ZoneCard } from "@/components/radar/zone-card";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useTeam, type TeamMember } from "@/hooks/use-team";
import { useZoneWeather } from "@/hooks/use-zone-weather";
import { playCry } from "@/lib/cry-player";
import {
  DEFAULT_FILTERS,
  activeFilterCount,
  matchesFilters,
  type RadarFilters,
} from "@/lib/filters";
import { applyWeather } from "@/lib/radar-spawns";
import type { RadarSpawn, WeatherVisitors, ZoneSpawns } from "@/lib/spawn";
import type { Zone } from "@/lib/zones";

/** How much closer the camera gets when focusing a single Pokémon. */
const POKEMON_ZOOM_BOOST = 1.5;

type RadarAppProps = {
  zones: readonly Zone[];
  spawnsByZone: ZoneSpawns;
  weatherVisitors: WeatherVisitors;
};

export function RadarApp({ zones, spawnsByZone, weatherVisitors }: RadarAppProps) {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedPokemonId, setSelectedPokemonId] = useState<number | null>(null);
  const [filters, setFilters] = useState<RadarFilters>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [soundOn, setSoundOn] = useLocalStorage("pokeradar:sound", true, isBoolean);
  const { team, catchPokemon, release, isFull } = useTeam();
  const weather = useZoneWeather(zones);
  const weatherByZone = weather.status === "ready" ? weather.byZone : NO_WEATHER;

  // Weather applied to every zone (not just the open one) so filter counts
  // at country level include each zone's weather visitor.
  const radarSpawnsByZone = useMemo(
    () =>
      Object.fromEntries(
        zones.map((zone) => [
          zone.id,
          applyWeather(
            zone,
            spawnsByZone[zone.id] ?? [],
            weatherByZone[zone.id] ?? null,
            weatherVisitors,
          ),
        ]),
      ) as Record<string, RadarSpawn[]>,
    [zones, spawnsByZone, weatherByZone, weatherVisitors],
  );

  const selectedZone = zones.find((zone) => zone.id === selectedZoneId) ?? null;
  const radarSpawns = useMemo(
    () => (selectedZone && radarSpawnsByZone[selectedZone.id]) || NO_SPAWNS,
    [selectedZone, radarSpawnsByZone],
  );
  const selectedSpawn =
    radarSpawns.find((spawn) => spawn.id === selectedPokemonId) ?? null;

  const filtering = activeFilterCount(filters) > 0;
  const matchCountByZone = useMemo(
    () =>
      Object.fromEntries(
        zones.map((zone) => [
          zone.id,
          (radarSpawnsByZone[zone.id] ?? []).filter((spawn) =>
            matchesFilters(spawn, filters),
          ).length,
        ]),
      ),
    [zones, radarSpawnsByZone, filters],
  );
  const matchingIds = useMemo(
    () =>
      filtering
        ? new Set(
            radarSpawns
              .filter((spawn) => matchesFilters(spawn, filters))
              .map((spawn) => spawn.id),
          )
        : null,
    [filtering, radarSpawns, filters],
  );
  const counts = Object.values(matchCountByZone);
  const totalMatches = counts.reduce((sum, count) => sum + count, 0);
  const zonesWithMatches = counts.filter((count) => count > 0).length;

  const cameraTarget = useMemo((): CameraTarget | null => {
    if (!selectedZone) return null;
    if (selectedSpawn) {
      return {
        center: selectedSpawn.position,
        zoom: selectedZone.zoom + POKEMON_ZOOM_BOOST,
      };
    }
    return { center: selectedZone.center, zoom: selectedZone.zoom };
  }, [selectedZone, selectedSpawn]);

  function selectZone(zoneId: string | null) {
    setSelectedZoneId(zoneId);
    setSelectedPokemonId(null);
  }

  function selectPokemon(spawn: RadarSpawn | undefined) {
    if (!spawn) return;
    // The drawer takes over; the filter panel would only cover it.
    setFiltersOpen(false);
    setSelectedPokemonId(spawn.id);
  }

  function focusTeamMember(member: TeamMember) {
    selectZone(member.zoneId);
    // A weather visitor may have left since it was caught: then we just
    // fly to the zone it came from.
    selectPokemon(radarSpawnsByZone[member.zoneId]?.find((s) => s.id === member.id));
  }

  const teamStatus: TeamStatus = team.some((m) => m.id === selectedPokemonId)
    ? "in-team"
    : isFull
      ? "full"
      : "available";

  useEffect(() => {
    // Esc steps back one level: filters → Pokémon → zone → whole country.
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (filtersOpen) setFiltersOpen(false);
      else if (selectedPokemonId !== null) setSelectedPokemonId(null);
      else setSelectedZoneId(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [filtersOpen, selectedPokemonId]);

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <MapLoader
        zones={zones}
        spawns={radarSpawns}
        matchingIds={matchingIds}
        matchCountByZone={filtering ? matchCountByZone : null}
        weatherByZone={weatherByZone}
        selectedZoneId={selectedZoneId}
        selectedPokemonId={selectedPokemonId}
        cameraTarget={cameraTarget}
        drawerOpen={selectedSpawn !== null}
        onSelectZone={selectZone}
        onSelectPokemon={(id) => selectPokemon(radarSpawns.find((s) => s.id === id))}
      />

      {/*
        Grid so brand card and team dock always share one column (same width):
        mobile → [brand | controls] / [team | –], column 1 takes what's left;
        desktop → column 1 sizes to its widest card, controls pinned right.
      */}
      <header className="pointer-events-none absolute inset-x-0 top-0 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 p-4 sm:grid-cols-[auto_1fr_auto] sm:gap-3 sm:p-6">
        <div className="pointer-events-auto col-start-1 row-start-1 rounded-2xl border border-white/10 bg-panel/80 px-4 py-3 backdrop-blur-md">
          <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="relative flex size-2.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-radar opacity-75" />
              <span className="relative size-2.5 rounded-full bg-radar" />
            </span>
            PokéRadar
          </h1>
          <p className="font-mono text-[11px] whitespace-nowrap text-white/50 uppercase sm:tracking-wider">
            Argentina
            <span className="hidden sm:inline"> · {zones.length} biomas</span>
            {weather.status === "ready" && " · clima en vivo"}
          </p>
        </div>
        <div className="col-start-1 row-start-2">
          <TeamDock team={team} onSelect={focusTeamMember} />
        </div>

        <div className="col-start-2 row-start-1 flex items-center gap-2 justify-self-end sm:col-start-3">
          <SoundToggle enabled={soundOn} onToggle={() => setSoundOn((on) => !on)} />
          <FilterPanel
            open={filtersOpen}
            onOpenChange={setFiltersOpen}
            filters={filters}
            onChange={setFilters}
            matchCount={totalMatches}
            zoneCount={zonesWithMatches}
          />
        </div>
      </header>

      <AnimatePresence>
        {selectedZone && !selectedSpawn && (
          <ZoneCard
            key={selectedZone.id}
            zone={selectedZone}
            spawns={radarSpawns}
            matchingIds={matchingIds}
            weather={weather}
            onSelectPokemon={(id) => selectPokemon(radarSpawns.find((s) => s.id === id))}
            onClose={() => selectZone(null)}
          />
        )}
      </AnimatePresence>

      <PokemonDrawer
        spawn={selectedSpawn}
        zone={selectedZone}
        team={{
          status: teamStatus,
          onCatch: () => {
            if (!selectedSpawn || !selectedZone) return;
            catchPokemon(selectedSpawn, selectedZone.id);
            // The cry is the capture's payoff. Played from the click handler,
            // so browsers allow the sound.
            if (soundOn && selectedSpawn.cry) {
              playCry(selectedSpawn.id, selectedSpawn.cry);
            }
          },
          onRelease: () => {
            if (selectedSpawn) release(selectedSpawn.id);
          },
        }}
        onClose={() => setSelectedPokemonId(null)}
      />
    </main>
  );
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/** Stable empty values, so memoized consumers don't recompute needlessly. */
const NO_WEATHER: Readonly<Record<string, never>> = {};
const NO_SPAWNS: RadarSpawn[] = [];
