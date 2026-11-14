"use client";

import { Led } from "@/components/device/hardware";
import { Sprite } from "@/components/pokemon/sprite";
import { TypeBadge } from "@/components/pokemon/type-badge";
import { WeatherIcon } from "@/components/weather/weather-icon";
import type { WeatherState } from "@/hooks/use-zone-weather";
import { plural } from "@/lib/format";
import { HABITAT_META } from "@/lib/habitats";
import type { RadarSpawn } from "@/lib/spawn";
import { WEATHER_META } from "@/lib/weather";
import type { Zone } from "@/lib/zones";
import { BoostMark, CART_LEGEND, Cartridge, Lcd, pad2, type Placement } from "@/components/device/parts";

type ZoneCardProps = {
  placement: Placement;
  screenHeight: number;
  zone: Zone;
  /** Position north → south, for the "Zona 03/09" sticker. */
  index: number;
  count: number;
  spawns: readonly RadarSpawn[];
  matchingIds: ReadonlySet<number> | null;
  weather: WeatherState;
  selectedPokemonId: number | null;
  onSelectPokemon: (pokemonId: number) => void;
  onClose: () => void;
};

/** The zone cartridge: where you are, today's weather, and who's around. */
export function ZoneCard({
  placement,
  screenHeight,
  zone,
  index,
  count,
  spawns,
  matchingIds,
  weather,
  selectedPokemonId,
  onSelectPokemon,
  onClose,
}: ZoneCardProps) {
  const habitat = HABITAT_META[zone.habitat];
  const boosted = spawns.filter((s) => s.boostedBy).length;
  const visitor = spawns.find((s) => s.isVisitor);
  const matching = matchingIds ? spawns.filter((s) => matchingIds.has(s.id)).length : null;

  return (
    <Cartridge
      id="bz-zone"
      placement={placement}
      screenHeight={screenHeight}
      label={`Zona ${pad2(index + 1)}/${pad2(count)} · ${habitat.label}`}
      led={habitat.color}
      ariaLabel={`Zona: ${zone.name}`}
      closeLabel="Volver al país"
      onClose={onClose}
      fit
    >
      <Lcd className="shrink-0 px-3.5 pt-3 pb-3">
        <p className="dex-font-lcd text-[11px] tracking-[0.14em] uppercase" style={{ color: habitat.color }}>
          {zone.province}
        </p>
        <h2 className="mt-1 text-[22px] leading-tight font-bold tracking-tight text-white">{zone.name}</h2>
        <p className="mt-1 text-[13px] leading-snug text-white/70 max-lg:hidden">{zone.description}</p>
        <WeatherReadout zoneId={zone.id} weather={weather} />
      </Lcd>

      <div className="flex shrink-0 items-baseline justify-between px-0.5">
        <p className={CART_LEGEND}>
          {spawns.length === 0
            ? "Sin señal"
            : matching !== null
              ? `${matching} de ${spawns.length} coinciden`
              : plural(spawns.length, "detectado")}
        </p>
        {boosted > 0 && (
          <p className="dex-font-lcd text-[11px] tracking-[0.12em] text-amber-200 uppercase">{plural(boosted, "potenciado")}</p>
        )}
      </div>

      {spawns.length > 0 ? (
        <ul className="dex-recess grid shrink-0 grid-cols-5 gap-1.5 rounded-xl p-1.5 max-lg:flex max-lg:overflow-x-auto max-lg:[scrollbar-width:none]">
          {spawns.map((spawn) => {
            const dimmed = matchingIds !== null && !matchingIds.has(spawn.id);
            const current = spawn.id === selectedPokemonId;
            const note = spawn.isVisitor ? " · visitante" : spawn.boostedBy ? " · potenciado" : "";
            return (
              <li key={spawn.id} className="max-lg:w-12 max-lg:shrink-0">
                <button
                  type="button"
                  onClick={() => onSelectPokemon(spawn.id)}
                  aria-label={`Ver ${spawn.name}${note}`}
                  aria-current={current ? "true" : undefined}
                  title={`${spawn.name}${note}`}
                  className={`relative grid aspect-square w-full cursor-pointer place-items-center rounded-[9px] bg-[#06110c]/80 transition-transform duration-100 ease-out outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-95 ${
                    current
                      ? "shadow-[inset_0_0_0_1.5px_#5cf2a5,0_0_8px_rgb(92_242_165/0.35)]"
                      : spawn.isVisitor
                        ? "shadow-[inset_0_0_0_1px_rgb(169_143_243/0.55)]"
                        : "shadow-[inset_0_0_0_1px_rgb(92_242_165/0.08)] hover:shadow-[inset_0_0_0_1px_rgb(92_242_165/0.45)]"
                  } ${dimmed ? "opacity-30" : ""}`}
                >
                  {spawn.sprite && (
                    <Sprite
                      src={spawn.sprite}
                      alt=""
                      width={40}
                      height={40}
                      // Out of flow, so a large sprite can't stretch the square tile.
                      className="absolute inset-0 m-auto size-[86%] object-contain [image-rendering:pixelated]"
                    />
                  )}
                  {spawn.boostedBy && (
                    <span aria-hidden className="absolute top-0.5 right-0.5 flex">
                      <BoostMark className="size-2.5" />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="dex-font-lcd px-1 text-xs text-amber-300/90 uppercase">El radar no detecta Pokémon en este hábitat.</p>
      )}

      {/* Phones: the roster comes first so it shows without scrolling. */}
      <p className="shrink-0 px-0.5 text-[13px] leading-snug text-white/70 lg:hidden">{zone.description}</p>

      {visitor && visitor.boostedBy && (
        <p className="flex shrink-0 items-center gap-2 px-0.5 text-[13px] leading-snug text-white/70 max-lg:hidden">
          {visitor.sprite && (
            <Sprite
              src={visitor.sprite}
              alt=""
              width={32}
              height={32}
              className="size-8 shrink-0 object-contain [image-rendering:pixelated]"
            />
          )}
          <span>
            <b className="font-semibold text-[#d8cdfc]">{visitor.name}</b> llegó con el clima (
            {WEATHER_META[visitor.boostedBy].label.toLowerCase()}): es el visitante de hoy.
          </span>
        </p>
      )}
    </Cartridge>
  );
}

function WeatherReadout({ zoneId, weather }: { zoneId: string; weather: WeatherState }) {
  if (weather.status === "loading") {
    return (
      <p className="dex-font-lcd mt-3 animate-pulse border-t border-radar/15 pt-2.5 text-xs text-radar/60 uppercase">
        Sintonizando el clima…
      </p>
    );
  }
  const current = weather.status === "ready" ? weather.byZone[zoneId] : undefined;
  if (!current) {
    return (
      <p className="dex-font-lcd mt-3 border-t border-radar/15 pt-2.5 text-xs text-white/55 uppercase">
        Clima no disponible · sin potenciados
      </p>
    );
  }
  const meta = WEATHER_META[current.kind];
  return (
    <div className="mt-3 border-t border-radar/15 pt-2.5">
      <div className="flex items-center gap-2.5">
        <span style={{ color: meta.color }}>
          <WeatherIcon kind={current.kind} isDay={current.isDay} className="size-[26px]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] leading-tight font-semibold text-white">{meta.label}</p>
          <p className="dex-font-lcd text-xs text-white/65">
            {current.temperatureC} °C · viento {current.windKmh} km/h
          </p>
        </div>
        <span className="flex items-center gap-1.5">
          <Led color="#22c55e" on size={6} />
          <span className="dex-font-lcd text-[11px] tracking-[0.12em] text-radar uppercase">En vivo</span>
        </span>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-white/60">Potencia:</span>
        {meta.boosts.map((type) => (
          <TypeBadge key={type} type={type} />
        ))}
      </div>
    </div>
  );
}
