"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { WeatherIcon } from "@/components/weather/weather-icon";
import type { WeatherState } from "@/hooks/use-zone-weather";
import { TYPE_META } from "@/lib/pokemon-types";
import type { RadarSpawn } from "@/lib/spawn";
import { WEATHER_META } from "@/lib/weather";
import type { Zone } from "@/lib/zones";
import { Cartridge, GREEN_KEY, Lcd, keyClass, pad2, type Placement } from "@/components/device/parts";

type TrackPanelProps = {
  placement: Placement;
  screenHeight: number;
  zone: Zone | null;
  weather: WeatherState;
  /** Boosted Pokémon of this zone that pass the filters. */
  boosted: readonly RadarSpawn[];
  /** Boosted across the whole country (filters applied). */
  countryCount: number;
  filtering: boolean;
  currentId: number | null;
  /** One cartridge at a time: offer a way over to the ficha. */
  showFichaLink: boolean;
  onTrack: (pokemonId: number) => void;
  onNext: () => void;
  onOpenFicha: () => void;
  onClose: () => void;
};

/**
 * Rastreo: every Pokémon the live weather boosts in this zone, with the
 * reason. "Próximo potenciado" walks the list and then the next zone, so
 * one key sweeps the whole country.
 */
export function TrackPanel({
  placement,
  screenHeight,
  zone,
  weather,
  boosted,
  countryCount,
  filtering,
  currentId,
  showFichaLink,
  onTrack,
  onNext,
  onOpenFicha,
  onClose,
}: TrackPanelProps) {
  const at = boosted.findIndex((s) => s.id === currentId);
  const now = zone && weather.status === "ready" ? weather.byZone[zone.id] : undefined;
  const meta = now ? WEATHER_META[now.kind] : null;
  const listRef = useRef<HTMLOListElement>(null);

  // Keep the tracked row in view as "next" walks down the list.
  useEffect(() => {
    // By hand: scrollIntoView would also scroll the overflow-hidden screen.
    const row = listRef.current?.querySelector<HTMLElement>('[aria-current="true"]');
    const scroller = row?.closest<HTMLElement>(".bz-scroll");
    if (!row || !scroller) return;
    const box = row.getBoundingClientRect();
    const view = scroller.getBoundingClientRect();
    if (box.top < view.top) scroller.scrollTop += box.top - view.top - 8;
    else if (box.bottom > view.bottom) scroller.scrollTop += box.bottom - view.bottom + 8;
  }, [currentId]);

  return (
    <Cartridge
      id="bz-track"
      placement={placement}
      screenHeight={screenHeight}
      label="Rastreo · Clima"
      aside={boosted.length > 0 ? `${at >= 0 ? pad2(at + 1) : "--"}/${pad2(boosted.length)}` : undefined}
      led="#fbbf24"
      ariaLabel="Rastreo de potenciados"
      closeLabel="Cerrar el rastreo"
      onClose={onClose}
      expandable
      footer={
        <button
          type="button"
          onClick={onNext}
          disabled={countryCount === 0}
          className={`${GREEN_KEY} flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold`}
        >
          {at >= 0 && at === boosted.length - 1 ? "Próxima zona con potenciados" : "Próximo potenciado"}
          <kbd className="dex-font-lcd ml-1 rounded-[4px] bg-[#04281a]/15 px-1.5 py-0.5 text-[11px] leading-none max-lg:hidden">
            P
          </kbd>
        </button>
      }
    >
      <Lcd className="shrink-0 px-3.5 py-3">
        {weather.status === "loading" ? (
          <p className="dex-font-lcd dex-lcd-text animate-pulse text-sm uppercase">Sintonizando el clima…</p>
        ) : !zone || !meta || !now ? (
          <p className="dex-font-lcd text-sm text-white/70 uppercase">Clima no disponible · sin potenciados</p>
        ) : (
          <>
            <p className="dex-font-lcd dex-lcd-text text-[15px] uppercase">
              {meta.label} {now.temperatureC}° · {boosted.length} {boosted.length === 1 ? "potenciado" : "potenciados"}
            </p>
            <p className="mt-1.5 text-[12.5px] leading-snug text-white/70">
              En {zone.name} el clima potencia a {joinAnd(meta.boosts.map((t) => TYPE_META[t].label))}
              {filtering && " (con tus filtros)"}.
            </p>
          </>
        )}
      </Lcd>

      {boosted.length === 0 ? (
        <p className="px-1 text-[13px] leading-snug text-white/70">
          {countryCount > 0
            ? `Nada potenciado en esta zona. Hay ${countryCount} en el resto del país: el botón te lleva a la próxima zona.`
            : filtering
              ? "Ningún potenciado coincide con tus filtros."
              : "Hoy el clima no potencia a ningún Pokémon."}
        </p>
      ) : (
        <ol ref={listRef} className="grid gap-1">
          {boosted.map((spawn, i) => {
            const current = spawn.id === currentId;
            const helped = spawn.boostedBy
              ? spawn.types.filter((t) => WEATHER_META[spawn.boostedBy ?? "clear"].boosts.includes(t))
              : [];
            return (
              <li
                key={spawn.id}
                aria-current={current ? "true" : undefined}
                className={`flex items-center rounded-[10px] ${
                  current
                    ? "bg-amber-300/10 shadow-[inset_0_0_0_1.5px_rgb(251_191_36/0.7)]"
                    : "bg-black/25 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.04)]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onTrack(spawn.id)}
                  className="grid min-w-0 flex-1 cursor-pointer grid-cols-[22px_40px_minmax(0,1fr)_auto] items-center gap-2 rounded-[10px] py-1 pr-2.5 pl-2 text-left transition-transform duration-100 ease-out outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-[0.98]"
                >
                  <span className={`dex-font-lcd text-[11px] ${current ? "text-amber-300" : "text-white/45"}`}>
                    {pad2(i + 1)}
                  </span>
                  {spawn.sprite ? (
                    <Image
                      src={spawn.sprite}
                      alt=""
                      width={40}
                      height={40}
                      unoptimized
                      className="size-10 object-contain [image-rendering:pixelated]"
                    />
                  ) : (
                    <span />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] font-semibold text-white">{spawn.name}</span>
                    <span className="block truncate text-xs text-[#d8cdfc]">
                      por {helped.map((t) => TYPE_META[t].label).join(" + ")}
                    </span>
                  </span>
                  {spawn.isVisitor ? (
                    <span className="dex-font-lcd rounded-[4px] border border-dashed border-[#a98ff3]/60 px-1.5 py-[3px] text-[10px] tracking-[0.08em] text-[#d8cdfc]">
                      VISITANTE
                    </span>
                  ) : (
                    spawn.boostedBy && (
                      <span
                        className="grid size-[22px] place-items-center rounded-[6px] border border-radar/25 bg-[#06110c]"
                        style={{ color: WEATHER_META[spawn.boostedBy].color }}
                        title={`Potenciado: ${WEATHER_META[spawn.boostedBy].label}`}
                      >
                        <WeatherIcon kind={spawn.boostedBy} className="size-[13px]" />
                      </span>
                    )
                  )}
                </button>
                {current && showFichaLink && (
                  <button
                    type="button"
                    onClick={onOpenFicha}
                    className={`${keyClass()} mr-1.5 h-8 shrink-0 rounded-lg px-2.5 text-xs font-medium`}
                  >
                    Ver ficha
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </Cartridge>
  );
}

function joinAnd(items: readonly string[]) {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} y ${items.at(-1)}`;
}
