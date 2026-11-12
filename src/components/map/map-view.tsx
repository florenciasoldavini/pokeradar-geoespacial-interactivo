"use client";

import { useEffect, useRef, useState } from "react";
import {
  Map as MapLibreMap,
  NavigationControl,
  setWorkerUrl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  CameraController,
  type CameraTarget,
} from "@/components/map/camera-controller";
import { MapContext } from "@/components/map/map-context";
import { applyRadarTheme } from "@/components/map/map-theme";
import { PokemonMarker } from "@/components/map/pokemon-marker";
import { RadarSweep } from "@/components/map/radar-sweep";
import { ZoneMarker } from "@/components/map/zone-marker";
import type { RadarSpawn } from "@/lib/spawn";
import type { ZoneWeather } from "@/lib/weather";
import { ARGENTINA_BOUNDS, type Zone } from "@/lib/zones";

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
  /** Per zone id, how many Pokémon pass the filters (when active). */
  matchCountByZone: Readonly<Record<string, number>> | null;
  /** Live weather per zone id; empty until Open-Meteo answers. */
  weatherByZone: Readonly<Record<string, ZoneWeather>>;
  selectedZoneId: string | null;
  selectedPokemonId: number | null;
  cameraTarget: CameraTarget | null;
  drawerOpen: boolean;
  onSelectZone: (zoneId: string) => void;
  onSelectPokemon: (pokemonId: number) => void;
};

/**
 * Everything that touches maplibre-gl lives under this component, which is
 * only ever loaded through <MapLoader> (ssr: false). Importing maplibre-gl
 * anywhere else would evaluate it on the server and crash on `window`.
 */
export function MapView({
  zones,
  spawns,
  matchingIds,
  matchCountByZone,
  weatherByZone,
  selectedZoneId,
  selectedPokemonId,
  cameraTarget,
  drawerOpen,
  onSelectZone,
  onSelectPokemon,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<MapLibreMap | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    const instance = new MapLibreMap({
      container,
      style: STYLE_URL,
      bounds: ARGENTINA_BOUNDS,
      fitBoundsOptions: { padding: 48 },
      minZoom: 2,
      maxPitch: 70,
      attributionControl: { compact: true },
    });
    instance.addControl(
      new NavigationControl({ visualizePitch: true }),
      "bottom-right",
    );
    // The OpenFreeMap dark style references icons (e.g. "circle-11") that its
    // sprite doesn't ship; register a transparent stand-in instead of warning.
    instance.on("styleimagemissing", ({ id }) => {
      if (!instance.hasImage(id)) {
        instance.addImage(id, { width: 1, height: 1, data: new Uint8Array(4) });
      }
    });
    instance.once("load", () => {
      applyRadarTheme(instance);
      if (!disposed) setMap(instance);
    });

    return () => {
      disposed = true;
      instance.remove();
    };
  }, []);

  const selectedZone = zones.find((zone) => zone.id === selectedZoneId);

  // Positioning lives on the wrapper: MapLibre adds `.maplibregl-map
  // { position: relative }` to the container, and that unlayered rule beats
  // Tailwind v4's layered utilities, which collapsed the map to 0px height.
  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="h-full w-full">
        {map && (
          <MapContext value={map}>
            <CameraController target={cameraTarget} drawerOpen={drawerOpen} />
            {zones.map((zone) => (
              <ZoneMarker
                key={zone.id}
                zone={zone}
                weather={weatherByZone[zone.id] ?? null}
                matchCount={matchCountByZone?.[zone.id] ?? null}
                selected={zone.id === selectedZoneId}
                onSelect={onSelectZone}
              />
            ))}
            {/* Painted into the map itself (canvas source), under all markers. */}
            {selectedZone && (
              <RadarSweep
                key={selectedZone.id}
                zone={selectedZone}
                spawns={spawns}
              />
            )}
            {spawns.map((spawn, index) => (
              <PokemonMarker
                // Zone-scoped key: a species living in two zones must replay
                // its reveal instead of sliding across the map.
                key={`${selectedZoneId}:${spawn.id}`}
                spawn={spawn}
                index={index}
                selected={spawn.id === selectedPokemonId}
                dimmed={matchingIds !== null && !matchingIds.has(spawn.id)}
                onSelect={onSelectPokemon}
              />
            ))}
          </MapContext>
        )}
      </div>
    </div>
  );
}
