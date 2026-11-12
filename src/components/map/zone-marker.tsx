"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MapMarker } from "@/components/map/map-marker";
import { WeatherIcon } from "@/components/weather/weather-icon";
import { HABITAT_META } from "@/lib/habitats";
import type { ZoneWeather } from "@/lib/weather";
import type { Zone } from "@/lib/zones";

type ZoneMarkerProps = {
  zone: Zone;
  /** Live weather, once Open-Meteo has answered. */
  weather: ZoneWeather | null;
  /** Pokémon here that pass the filters; null when no filter is active. */
  matchCount: number | null;
  selected: boolean;
  onSelect: (zoneId: string) => void;
};

export function ZoneMarker({
  zone,
  weather,
  matchCount,
  selected,
  onSelect,
}: ZoneMarkerProps) {
  const empty = matchCount === 0 && !selected;
  const { color, label } = HABITAT_META[zone.habitat];

  return (
    <MapMarker lngLat={zone.center}>
      <motion.button
        type="button"
        onClick={() => onSelect(zone.id)}
        aria-label={[
          `${zone.name}, hábitat ${label}`,
          matchCount !== null && `${matchCount} coincidencias`,
        ]
          .filter(Boolean)
          .join(", ")}
        aria-pressed={selected}
        // Zones with nothing matching the filters fade back.
        animate={{ opacity: empty ? 0.3 : 1 }}
        className="group relative grid size-6 cursor-pointer place-items-center outline-none"
        style={{ color }}
      >
        {/* The button is exactly the dot, so MapLibre's center anchor lands on
            the real coordinate; the label hangs below, out of the layout. */}
        <span className="relative grid size-6 place-items-center">
          {/* Radar ping: expands and fades, staggered so zones don't pulse in sync. */}
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full border border-current"
            initial={{ scale: 0.6, opacity: 0.9 }}
            animate={{ scale: 2.6, opacity: 0 }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeOut",
              delay: Math.abs(zone.center[0] % 1) * 2.4,
            }}
          />
          <motion.span
            aria-hidden
            className="size-3 rounded-full bg-current shadow-[0_0_12px_currentColor] ring-2 ring-black/60"
            animate={{ scale: selected ? 1.5 : 1 }}
            whileHover={{ scale: 1.4 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          />
        </span>
        <AnimatePresence>
          {matchCount !== null && matchCount > 0 && (
            <motion.span
              key={matchCount}
              aria-hidden
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              // leading-none: markers inherit MapLibre's `font: 12px/20px`, and
              // that 20px line box pushed the digit off-center in a 16px badge.
              className={`absolute -top-2.5 -right-3 flex h-4 items-center justify-center rounded-full bg-radar font-mono text-[10px] leading-none font-semibold text-radar-bg tabular-nums ${
                matchCount < 10 ? "w-4" : "px-1"
              }`}
            >
              {matchCount}
            </motion.span>
          )}
        </AnimatePresence>
        <span
          className={`pointer-events-none absolute top-full left-1/2 mt-1.5 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/10 bg-black/70 px-2 py-0.5 font-mono text-[10px] tracking-wider whitespace-nowrap text-white/90 uppercase backdrop-blur-sm transition-opacity ${
            selected
              ? "opacity-100"
              : "opacity-70 group-hover:opacity-100 group-focus-visible:opacity-100"
          }`}
        >
          {zone.name}
          {weather && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              className="flex items-center gap-1 overflow-hidden border-l border-white/15 pl-1.5 text-white/70"
            >
              <WeatherIcon
                kind={weather.kind}
                isDay={weather.isDay}
                className="size-3 shrink-0"
              />
              {weather.temperatureC}°
            </motion.span>
          )}
        </span>
      </motion.button>
    </MapMarker>
  );
}
