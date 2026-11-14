"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { MapMarker } from "@/components/map/map-marker";
import { WeatherIcon } from "@/components/weather/weather-icon";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { TYPE_META } from "@/lib/pokemon-types";
import type { RadarSpawn } from "@/lib/spawn";
import { WEATHER_META } from "@/lib/weather";
import { Brackets } from "@/components/device/parts";

export type MarkerLock = "selected" | "tracked" | null;

type PokemonMarkerProps = {
  spawn: RadarSpawn;
  /** Position in the zone's roster; drives the staggered reveal. */
  index: number;
  /** Green lock for the open ficha, amber while the rastreo points at it. */
  lock: MarkerLock;
  /** Filtered out: stays for context, but steps back. */
  dimmed: boolean;
  onSelect: (pokemonId: number) => void;
};

/**
 * Fork of the Pokédex variant's marker: no CSS filters at all (production
 * blurred the boost aura and drop-shadowed every GIF, which repaints while
 * the map moves), and the idle bob is a CSS keyframe instead of a
 * per-frame JavaScript animation.
 */
export function PokemonMarker({ spawn, index, lock, dimmed, onSelect }: PokemonMarkerProps) {
  const reduce = useReducedMotion();
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
  const locked = lock !== null;

  return (
    <MapMarker lngLat={spawn.position}>
      {/* Reveal waits for most of the flight, then pings in one by one. */}
      <motion.span
        className="block"
        initial={reduce ? false : { opacity: 0, scale: 0.3 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 + index * 0.07, type: "spring", stiffness: 300, damping: 18 }}
      >
        <button
          type="button"
          onClick={() => onSelect(spawn.id)}
          aria-label={label}
          aria-pressed={locked}
          data-lock={lock ?? undefined}
          className={`group relative grid size-16 cursor-pointer place-items-center transition-[transform,opacity] duration-200 ease-out outline-hidden focus-visible:rounded-full focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-white ${
            locked ? "scale-[1.18]" : dimmed ? "scale-80 opacity-25" : "hover:scale-110"
          }`}
          style={{ color }}
        >
          {boost && (
            <span
              aria-hidden
              className="absolute inset-0 rounded-full"
              style={{ background: `radial-gradient(circle, ${boost.color}45, transparent 65%)` }}
            />
          )}
          {/* Ground plate in the primary type color; dashed for visitors. */}
          <span
            aria-hidden
            className={`absolute bottom-2 h-3.5 w-11 rounded-[50%] border border-current bg-current/20 ${
              spawn.isVisitor ? "border-dashed" : ""
            } ${locked ? "opacity-100" : "opacity-60"}`}
          />
          <span aria-hidden className="absolute bottom-[11px] h-1.5 w-7 rounded-[50%] bg-black/55" />
          {locked && (
            <motion.span
              key={lock}
              aria-hidden
              className={`absolute -inset-1 ${lock === "tracked" ? "text-amber-300" : "text-radar"}`}
              initial={reduce ? false : { scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <Brackets />
            </motion.span>
          )}
          <span
            className="bz-bob relative mb-3 grid size-14 place-items-end justify-center"
            style={{ "--bob": `${2.2 + (index % 3) * 0.3}s` } as CSSProperties}
          >
            {spawn.sprite ? (
              <Image
                src={spawn.sprite}
                alt=""
                width={56}
                height={56}
                unoptimized
                draggable={false}
                className="size-14 object-contain object-bottom [image-rendering:pixelated]"
              />
            ) : (
              <span className="font-mono text-xs text-white/70">?</span>
            )}
          </span>
          {boost && spawn.boostedBy && (
            <span
              aria-hidden
              className="absolute top-1 right-0 grid size-5 place-items-center rounded-[5px] border border-radar/25 bg-[#06110c] shadow-[0_2px_4px_rgb(0_0_0/0.5)]"
              style={{ color: boost.color }}
            >
              <WeatherIcon kind={spawn.boostedBy} className="size-3" />
            </span>
          )}
          {spawn.isVisitor && (
            <span
              aria-hidden
              className="dex-font-lcd absolute top-full -mt-1 rounded-[3px] border border-dashed border-[#a98ff3]/60 bg-[#06110c] px-1 py-0.5 text-[9px] leading-none tracking-[0.08em] whitespace-nowrap text-[#d8cdfc]"
            >
              VISITANTE
            </span>
          )}
        </button>
      </motion.span>
    </MapMarker>
  );
}
