"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { TypeBadge } from "@/components/pokemon/type-badge";
import { WeatherIcon } from "@/components/weather/weather-icon";
import type { WeatherState } from "@/hooks/use-zone-weather";
import { HABITAT_META } from "@/lib/habitats";
import type { RadarSpawn } from "@/lib/spawn";
import { WEATHER_META } from "@/lib/weather";
import type { Zone } from "@/lib/zones";

type ZoneCardProps = {
  zone: Zone;
  spawns: readonly RadarSpawn[];
  /** Pokémon ids passing the filters; null when no filter is active. */
  matchingIds: ReadonlySet<number> | null;
  weather: WeatherState;
  onSelectPokemon: (pokemonId: number) => void;
  onClose: () => void;
};

export function ZoneCard({
  zone,
  spawns,
  matchingIds,
  weather,
  onSelectPokemon,
  onClose,
}: ZoneCardProps) {
  const habitat = HABITAT_META[zone.habitat];

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="absolute inset-x-4 bottom-4 max-h-[60dvh] overflow-y-auto rounded-2xl border border-white/10 bg-panel/85 p-4 backdrop-blur-md sm:right-auto sm:bottom-6 sm:left-6 sm:w-80"
    >
      <p
        className="font-mono text-[11px] tracking-wider uppercase"
        style={{ color: habitat.color }}
      >
        {habitat.label} · {zone.province}
      </p>
      <h2 className="mt-1 text-xl font-semibold tracking-tight">{zone.name}</h2>
      <p className="mt-1 text-sm text-white/60">{zone.description}</p>

      <ZoneWeatherPanel zoneId={zone.id} weather={weather} />

      <div className="mt-3 border-t border-white/8 pt-3">
        {spawns.length > 0 ? (
          <>
            <p className="font-mono text-[11px] tracking-wider text-white/45 uppercase">
              {spawns.length} Pokémon detectados
            </p>
            <ul className="mt-2 flex flex-wrap gap-1">
              {spawns.map((spawn) => (
                <li key={spawn.id}>
                  <button
                    type="button"
                    onClick={() => onSelectPokemon(spawn.id)}
                    aria-label={`Ver ${spawn.name}`}
                    title={spawn.name}
                    className={`relative grid size-9 cursor-pointer place-items-center rounded-lg bg-white/4 transition hover:bg-white/12 ${
                      spawn.isVisitor ? "outline outline-dashed outline-white/25" : ""
                    } ${matchingIds && !matchingIds.has(spawn.id) ? "opacity-25 grayscale" : ""}`}
                  >
                    {spawn.sprite && (
                      <Image
                        src={spawn.sprite}
                        alt=""
                        width={28}
                        height={28}
                        unoptimized
                        className="size-7 object-contain [image-rendering:pixelated]"
                      />
                    )}
                    {spawn.boostedBy && (
                      <span
                        aria-hidden
                        className="absolute -top-0.5 -right-0.5 size-2 rounded-full ring-2 ring-panel"
                        style={{ backgroundColor: WEATHER_META[spawn.boostedBy].color }}
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="font-mono text-[11px] tracking-wider text-amber-300/80 uppercase">
            Sin señal en esta zona
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="mt-3 cursor-pointer font-mono text-xs tracking-wider text-white/50 uppercase transition-colors hover:text-white"
      >
        ← Volver al mapa <kbd className="ml-1 text-white/30">Esc</kbd>
      </button>
    </motion.section>
  );
}

function ZoneWeatherPanel({
  zoneId,
  weather,
}: {
  zoneId: string;
  weather: WeatherState;
}) {
  if (weather.status === "loading") {
    return (
      <p className="mt-3 animate-pulse font-mono text-[11px] tracking-wider text-white/40 uppercase">
        Sintonizando clima…
      </p>
    );
  }
  const current = weather.status === "ready" ? weather.byZone[zoneId] : undefined;
  if (!current) {
    return (
      <p className="mt-3 font-mono text-[11px] tracking-wider text-white/40 uppercase">
        Clima no disponible · sin bonificaciones
      </p>
    );
  }

  const meta = WEATHER_META[current.kind];
  return (
    <div className="mt-3 rounded-xl border border-white/8 bg-white/3 p-3">
      <div className="flex items-center gap-2.5">
        <span style={{ color: meta.color }}>
          <WeatherIcon kind={current.kind} isDay={current.isDay} className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{meta.label}</p>
          <p className="font-mono text-[11px] text-white/45">
            {current.temperatureC}°C · viento {current.windKmh} km/h
          </p>
        </div>
        <span className="font-mono text-[10px] tracking-wider text-radar/80 uppercase">
          En vivo
        </span>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-white/45">Potencia:</span>
        {meta.boosts.map((type) => (
          <TypeBadge key={type} type={type} />
        ))}
      </div>
    </div>
  );
}
