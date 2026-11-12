"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { MapMarker } from "@/components/map/map-marker";
import { WeatherIcon } from "@/components/weather/weather-icon";
import { TYPE_META } from "@/lib/pokemon-types";
import type { RadarSpawn } from "@/lib/spawn";
import { WEATHER_META } from "@/lib/weather";

type PokemonMarkerProps = {
  spawn: RadarSpawn;
  /** Position in the zone's roster; drives the staggered reveal. */
  index: number;
  selected: boolean;
  /** Filtered out: stays on the map for context, but steps back. */
  dimmed: boolean;
  onSelect: (pokemonId: number) => void;
};

export function PokemonMarker({
  spawn,
  index,
  selected,
  dimmed,
  onSelect,
}: PokemonMarkerProps) {
  const primaryType = spawn.types[0];
  const color = primaryType ? TYPE_META[primaryType].color : "#ffffff";
  const boost = spawn.boostedBy ? WEATHER_META[spawn.boostedBy] : null;
  const label = [
    `Ver ${spawn.name}`,
    spawn.isVisitor && "visitante",
    boost && `potenciado por ${boost.label.toLowerCase()}`,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <MapMarker lngLat={spawn.position}>
      {/* Reveal waits for most of the camera flight, then "pings" in one by
          one. Kept on a wrapper so its delay never affects hover/selection. */}
      <motion.span
        className="block"
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          delay: 0.9 + index * 0.09,
          type: "spring",
          stiffness: 260,
          damping: 16,
        }}
      >
        <motion.button
          type="button"
          onClick={() => onSelect(spawn.id)}
          aria-label={label}
          aria-pressed={selected}
          animate={{
            scale: selected ? 1.25 : dimmed ? 0.8 : 1,
            opacity: dimmed && !selected ? 0.25 : 1,
            filter: dimmed && !selected ? "grayscale(1)" : "grayscale(0)",
          }}
          whileHover={{ scale: selected ? 1.3 : 1.15 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          className="group relative grid size-16 cursor-pointer place-items-center outline-none"
          style={{ color }}
        >
          {/* Weather boost: a soft aura in the weather's color. */}
          {boost && (
            <span
              aria-hidden
              className="absolute inset-1 rounded-full blur-md"
              style={{
                background: `radial-gradient(circle, ${boost.color}55, transparent 70%)`,
              }}
            />
          )}
          {/* Ground disc in the primary type color; dashed for visitors. */}
          <span
            aria-hidden
            className={`absolute bottom-2 h-3.5 w-11 rounded-[50%] border border-current bg-current/20 transition-opacity ${
              spawn.isVisitor ? "border-dashed" : ""
            }`}
            style={{ opacity: selected ? 1 : 0.6 }}
          />
          {selected && (
            <motion.span
              aria-hidden
              className="absolute bottom-2 h-3.5 w-11 rounded-[50%] border-2 border-current"
              initial={{ scale: 1, opacity: 0.9 }}
              animate={{ scale: 2.2, opacity: 0 }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
            />
          )}
          {/* Idle bob, desynced per Pokémon so the group feels alive. */}
          <motion.span
            className="relative mb-3 grid size-14 place-items-end justify-center"
            animate={{ y: [0, -3, 0] }}
            transition={{
              duration: 2.2 + (index % 3) * 0.3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {spawn.sprite ? (
              <Image
                src={spawn.sprite}
                alt=""
                width={56}
                height={56}
                unoptimized
                draggable={false}
                className="size-14 object-contain object-bottom drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] [image-rendering:pixelated]"
              />
            ) : (
              <span className="font-mono text-xs text-white/70">?</span>
            )}
          </motion.span>
          {spawn.boostedBy && boost && (
            <span
              aria-hidden
              className="absolute top-1 right-0 grid size-5 place-items-center rounded-full border border-white/15 bg-panel/90 shadow-md"
              style={{ color: boost.color }}
            >
              <WeatherIcon kind={spawn.boostedBy} className="size-3" />
            </span>
          )}
        </motion.button>
      </motion.span>
    </MapMarker>
  );
}
