"use client";

import { useEffect, useRef, useState } from "react";
import { AJAXError, Map as MapLibreMap, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapContext } from "@/components/map/map-context";
import { RadarSweep } from "@/components/map/radar-sweep";
import { ScreenError, ScreenWarmup } from "@/components/map/screen-status";
import type { RadarSpawn } from "@/lib/spawn";
import type { ZoneWeather } from "@/lib/weather";
import { ARGENTINA_BOUNDS, type Zone } from "@/lib/zones";
import { applyRadarTheme } from "@/components/map/map-theme";
import { CameraController, type CameraPadding, type CameraTarget } from "./camera-controller";
import { PokemonMarker, type MarkerLock } from "./pokemon-marker";
import { ZoneMarker } from "./zone-marker";

const STYLE_URL = "https://tiles.openfreemap.org/styles/dark";

// MapLibre resolves its worker relative to its own module, which doesn't
// survive bundling; serve the copy from /public instead (see scripts/).
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

export type MapViewProps = {
  zones: readonly Zone[];
  /** Pokémon of the zone being explored (empty at country level). */
  spawns: readonly RadarSpawn[];
  /** Pokémon ids passing the filters; null when no filter is active. */
  matchingIds: ReadonlySet<number> | null;
  /** Per zone id, how many Pokémon pass the filters (when shown). */
  matchCountByZone: Readonly<Record<string, number>> | null;
  weatherByZone: Readonly<Record<string, ZoneWeather>>;
  selectedZoneId: string | null;
  selectedPokemonId: number | null;
  /** The rastreo is pointing at the selected Pokémon. */
  tracking: boolean;
  /** Phones: tags hang inwards, and hide while a sheet squeezes the map. */
  compact: boolean;
  tagsHidden: boolean;
  cameraTarget: CameraTarget | null;
  cameraPadding: CameraPadding;
  onSelectZone: (zoneId: string) => void;
  onSelectPokemon: (pokemonId: number) => void;
};

/**
 * The MapLibre map with its phosphor tint, zone and Pokémon markers, and
 * the canvas-source radar sweep, painted into the map so it keeps true
 * perspective. Only ever loaded through <MapLoader> (ssr: false).
 */
export function MapView({
  zones,
  spawns,
  matchingIds,
  matchCountByZone,
  weatherByZone,
  selectedZoneId,
  selectedPokemonId,
  tracking,
  compact,
  tagsHidden,
  cameraTarget,
  cameraPadding,
  onSelectZone,
  onSelectPokemon,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<MapLibreMap | null>(null);
  const [failed, setFailed] = useState(false);
  /** Bumped by "Reintentar" to rebuild the map from scratch. */
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let instance: MapLibreMap;
    try {
      instance = new MapLibreMap({
        container,
        style: STYLE_URL,
        bounds: ARGENTINA_BOUNDS,
        fitBoundsOptions: { padding: 40 },
        minZoom: 2,
        maxPitch: 70,
        attributionControl: { compact: true },
      });
    } catch {
      // No WebGL: MapLibre throws while creating its context.
      queueMicrotask(() => {
        if (!disposed) setFailed(true);
      });
      return () => {
        disposed = true;
      };
    }
    // Only the style request failing is fatal; a missing tile or sprite
    // sheet just leaves a gap.
    instance.on("error", ({ error }) => {
      if (!disposed && error instanceof AJAXError && error.url === STYLE_URL) setFailed(true);
    });
    // The dark style references icons its sprite doesn't ship.
    instance.on("styleimagemissing", ({ id }) => {
      if (!instance.hasImage(id)) {
        instance.addImage(id, { width: 1, height: 1, data: new Uint8Array(4) });
      }
    });
    instance.once("load", () => {
      applyRadarTheme(instance);
      // Compact attribution starts unfolded over the map; keep it a button.
      container.querySelector(".maplibregl-compact-show")?.classList.remove("maplibregl-compact-show");
      if (!disposed) setMap(instance);
    });

    return () => {
      disposed = true;
      setMap(null);
      instance.remove();
    };
  }, [attempt]);

  function retry() {
    setFailed(false);
    setAttempt((n) => n + 1);
  }

  const selectedZone = zones.find((zone) => zone.id === selectedZoneId);

  // Positioning lives on the wrapper: MapLibre's unlayered
  // `.maplibregl-map { position: relative }` beats Tailwind utilities.
  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="h-full w-full">
        {map && (
          <MapContext value={map}>
            <CameraController target={cameraTarget} padding={cameraPadding} />
            {zones.map((zone) => (
              <ZoneMarker
                key={zone.id}
                zone={zone}
                weather={weatherByZone[zone.id] ?? null}
                matchCount={matchCountByZone?.[zone.id] ?? null}
                selected={zone.id === selectedZoneId}
                receded={selectedZoneId !== null && zone.id !== selectedZoneId}
                tagsHidden={tagsHidden}
                compact={compact}
                onSelect={onSelectZone}
              />
            ))}
            {selectedZone && <RadarSweep key={selectedZone.id} zone={selectedZone} spawns={spawns} />}
            {spawns.map((spawn, index) => (
              <PokemonMarker
                // Zone-scoped key: a species in two zones replays its reveal.
                key={`${selectedZoneId}:${spawn.id}`}
                spawn={spawn}
                index={index}
                lock={lockFor(spawn.id, selectedPokemonId, tracking)}
                dimmed={matchingIds !== null && !matchingIds.has(spawn.id)}
                onSelect={onSelectPokemon}
              />
            ))}
          </MapContext>
        )}
      </div>
      {failed ? <ScreenError onRetry={retry} /> : !map && <ScreenWarmup />}
    </div>
  );
}

function lockFor(id: number, selectedId: number | null, tracking: boolean): MarkerLock {
  if (id !== selectedId) return null;
  return tracking ? "tracked" : "selected";
}
