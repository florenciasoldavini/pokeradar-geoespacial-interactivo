"use client";

import type { CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MapMarker } from "@/components/map/map-marker";
import { WeatherIcon } from "@/components/weather/weather-icon";
import { HABITAT_META } from "@/lib/habitats";
import type { ZoneWeather } from "@/lib/weather";
import type { Zone } from "@/lib/zones";
import { Brackets } from "@/components/device/parts";

type ZoneMarkerProps = {
  zone: Zone;
  weather: ZoneWeather | null;
  /** Pokémon here that pass the filters; null when not showing counts. */
  matchCount: number | null;
  selected: boolean;
  /** Another zone is open: this one steps back and drops its tag. */
  receded: boolean;
  /** Phones with a sheet up: the squeezed map has no room for tags. */
  tagsHidden: boolean;
  /** Phones: tags near the screen's edge hang inwards. */
  compact: boolean;
  onSelect: (zoneId: string) => void;
};

/**
 * Fork of the Pokédex variant's LCD waypoint. Inside a zone the cartridge
 * carries the zone's name, so every tag hides and the other zones recede;
 * the pulse is a CSS keyframe, so an idle map costs no JavaScript.
 */
export function ZoneMarker({ zone, weather, matchCount, selected, receded, tagsHidden, compact, onSelect }: ZoneMarkerProps) {
  const empty = matchCount === 0 && !selected;
  const { color, label } = HABITAT_META[zone.habitat];
  const showTag = !selected && !receded && !tagsHidden;
  const side = compact ? (TAG_SIDE[zone.id] ?? "below") : "below";

  return (
    <MapMarker lngLat={zone.center}>
      <button
        type="button"
        onClick={() => onSelect(zone.id)}
        aria-label={[
          `${zone.name}, hábitat ${label}`,
          weather && `${weather.temperatureC} °C`,
          matchCount !== null && `${matchCount} coincidencias`,
        ]
          .filter(Boolean)
          .join(", ")}
        aria-pressed={selected}
        className={`group relative grid size-6 cursor-pointer place-items-center transition-opacity duration-200 ease-out outline-hidden focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-white ${
          receded ? "opacity-30" : empty ? "opacity-40" : "opacity-100"
        }`}
        style={{ color, "--delay": `${(Math.abs(zone.center[0] % 1) * 2.4).toFixed(2)}s` } as CSSProperties}
      >
        <span aria-hidden className="bz-pulse absolute inset-0 rounded-[5px] border border-current" />
        {/* Waypoint: a lit pixel in the habitat's color. */}
        <span
          aria-hidden
          className={`size-3 rounded-[3px] bg-current shadow-[0_0_10px_currentColor] ring-2 ring-black/70 transition-transform duration-200 ease-out ${
            selected ? "scale-140 rotate-45" : "group-hover:scale-135"
          }`}
        />
        {selected && (
          <span aria-hidden className="absolute -inset-2.5">
            <Brackets />
          </span>
        )}
        <AnimatePresence>
          {matchCount !== null && matchCount > 0 && !receded && (
            <motion.span
              key={matchCount}
              aria-hidden
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 26 }}
              className={`dex-font-lcd absolute -right-3.5 ${side === "above" ? "-bottom-3" : "-top-3"} flex h-4 items-center justify-center rounded-[4px] bg-radar text-[11px] leading-none text-[#06110c] tabular-nums shadow-[0_0_8px_rgb(92_242_165/0.6)] ${
                matchCount < 10 ? "w-4" : "px-1"
              }`}
            >
              {matchCount}
            </motion.span>
          )}
        </AnimatePresence>
        {/* leading-none: markers inherit MapLibre's 12px/20px font. */}
        <span
          className={`dex-font-lcd pointer-events-none absolute flex items-center ${TAG_POSITION[side]} gap-1.5 rounded-[4px] border border-radar/25 bg-[#06110c] px-1.5 py-[3px] text-[11px] leading-none max-lg:gap-1 max-lg:px-1 max-lg:text-[10px] max-lg:tracking-[0.03em] whitespace-nowrap text-[#c9f7df] uppercase transition-opacity duration-150 ease-out ${
            showTag ? "opacity-100" : "opacity-0"
          }`}
        >
          {zone.name}
          {weather && (
            <span className="flex items-center gap-1 border-l border-radar/25 pl-1.5 text-[#c9f7df]/80">
              <WeatherIcon kind={weather.kind} isDay={weather.isDay} className="size-3 shrink-0" />
              {weather.temperatureC}°
            </span>
          )}
        </span>
      </button>
    </MapMarker>
  );
}

type TagSide = "below" | "right" | "left" | "above";

const TAG_POSITION: Record<TagSide, string> = {
  below: "top-full left-1/2 mt-2 -translate-x-1/2",
  right: "top-full -left-0.5 mt-2",
  left: "top-full -right-0.5 mt-2",
  above: "bottom-full -left-0.5 mb-2",
};

/** Phones (from the mockup): zones near an edge or a neighbour hang their tag aside. */
const TAG_SIDE: Partial<Record<string, TagSide>> = {
  aconcagua: "right",
  "nahuel-huapi": "above",
  "cueva-de-las-manos": "right",
  iguazu: "left",
  "buenos-aires": "right",
};
