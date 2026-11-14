"use client";

import type { CSSProperties, ReactNode } from "react";
import { RangeSlider } from "@/components/ui/range-slider";
import {
  DEFAULT_FILTERS,
  GENERATIONS,
  STAT_TOTAL_BOUNDS,
  activeFilterCount,
  toggled,
  type RadarFilters,
} from "@/lib/filters";
import { plural } from "@/lib/format";
import { POKEMON_TYPES, TYPE_META } from "@/lib/pokemon-types";
import { CART_LEGEND, Cartridge, GREEN_KEY, Lcd, keyClass, type Placement } from "@/components/device/parts";

type FilterPanelProps = {
  placement: Placement;
  screenHeight: number;
  filters: RadarFilters;
  onChange: (filters: RadarFilters) => void;
  matchCount: number;
  zoneCount: number;
  onClose: () => void;
};

/**
 * The filters as a cartridge of keycaps. The result
 * line and the primary key both say what you'll see on the map.
 */
export function FilterPanel({ placement, screenHeight, filters, onChange, matchCount, zoneCount, onClose }: FilterPanelProps) {
  const active = activeFilterCount(filters);
  const result = `${matchCount} Pokémon en ${zoneCount} ${zoneCount === 1 ? "zona" : "zonas"}`;

  return (
    <Cartridge
      id="bz-filters"
      placement={placement}
      screenHeight={screenHeight}
      label="Filtros"
      aside={active > 0 ? `${active} ${active === 1 ? "activo" : "activos"}` : "ninguno"}
      led="#5cf2a5"
      ariaLabel="Filtros del radar"
      closeLabel="Cerrar los filtros"
      onClose={onClose}
      fit
      expandable
      footer={
        matchCount === 0 ? (
          // Nothing to see on the map: the way forward is loosening the filters.
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className={`${GREEN_KEY} h-11 w-full truncate rounded-xl px-3 text-[15px] font-semibold`}
          >
            Ningún Pokémon coincide · Limpiar filtros
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onChange(DEFAULT_FILTERS)}
              disabled={active === 0}
              className={`${keyClass()} h-11 shrink-0 rounded-xl px-4 text-sm font-medium disabled:opacity-40`}
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`${GREEN_KEY} h-11 min-w-0 flex-1 truncate rounded-xl px-3 text-[15px] font-semibold`}
            >
              <span className="lg:hidden">Ver {result}</span>
              <span className="max-lg:hidden">Ver {matchCount} en el mapa</span>
            </button>
          </div>
        )
      }
    >
      <Lcd className="shrink-0 px-3.5 py-2.5 max-lg:hidden">
        <p className="dex-font-lcd text-[11px] tracking-[0.12em] text-radar/65 uppercase">Resultado</p>
        <p className="dex-font-lcd dex-lcd-text mt-1 text-[17px] leading-none" aria-live="polite">
          {result}
        </p>
      </Lcd>

      <Section title="Tipo" aside={filters.types.length > 0 ? plural(filters.types.length, "elegido") : "todos"}>
        <div className="grid grid-cols-3 gap-1.5 max-lg:grid-cols-4">
          {POKEMON_TYPES.map((type) => {
            const selected = filters.types.includes(type);
            const { label, color } = TYPE_META[type];
            return (
              <button
                key={type}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange({ ...filters, types: toggled(filters.types, type) })}
                className={`${keyClass(selected)} flex h-8 min-w-0 items-center gap-1.5 rounded-[9px] px-2 text-left text-[12.5px] max-lg:px-1.5 max-lg:text-xs`}
                style={
                  selected
                    ? ({
                        background: `linear-gradient(180deg, color-mix(in srgb, ${color} 34%, #1a1d22), color-mix(in srgb, ${color} 18%, #121418))`,
                        boxShadow: `0 0.5px 0 rgb(0 0 0 / 0.55), inset 0 1px 3px rgb(0 0 0 / 0.55), inset 0 0 0 1px color-mix(in srgb, ${color} 70%, transparent)`,
                      } satisfies CSSProperties)
                    : undefined
                }
              >
                <span
                  aria-hidden
                  className="size-[7px] shrink-0 rounded-full shadow-[0_0_0_1px_rgb(0_0_0/0.5)]"
                  style={{ backgroundColor: color, boxShadow: selected ? `0 0 6px ${color}` : undefined }}
                />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Generación">
        <div className="grid grid-cols-4 overflow-hidden rounded-[11px] shadow-[0_0_0_1px_rgb(0_0_0/0.5)]">
          <button
            type="button"
            aria-pressed={filters.generations.length === 0}
            onClick={() => onChange({ ...filters, generations: [] })}
            className={`${keyClass(filters.generations.length === 0)} h-10 rounded-none text-[13px]`}
          >
            Todas
          </button>
          {GENERATIONS.map((generation) => {
            const selected = filters.generations.includes(generation.value);
            return (
              <button
                key={generation.value}
                type="button"
                aria-pressed={selected}
                aria-label={`Generación ${generation.label}: ${generation.region}`}
                onClick={() => onChange({ ...filters, generations: toggled(filters.generations, generation.value) })}
                className={`${keyClass(selected)} flex h-10 flex-col items-center justify-center gap-0.5 rounded-none border-l border-black/50`}
              >
                <span className={`dex-font-lcd text-[13px] leading-none ${selected ? "dex-lcd-text" : ""}`}>
                  {generation.label}
                </span>
                <span className="text-[10.5px] leading-none text-white/60">{generation.region}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section
        title="Total de estadísticas"
        aside={
          <span className="dex-font-lcd dex-lcd-text text-[13px] tabular-nums">
            {filters.statTotal[0]} a {filters.statTotal[1]}
          </span>
        }
      >
        <Lcd className="px-4 py-1.5">
          <RangeSlider
            min={STAT_TOTAL_BOUNDS.min}
            max={STAT_TOTAL_BOUNDS.max}
            step={STAT_TOTAL_BOUNDS.step}
            value={filters.statTotal}
            onChange={(statTotal) => onChange({ ...filters, statTotal })}
            labels={["Total mínimo", "Total máximo"]}
          />
        </Lcd>
      </Section>
    </Cartridge>
  );
}

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <div role="group" aria-label={title} className="shrink-0">
      <div className="mb-1.5 flex items-baseline justify-between px-0.5">
        <h3 className={CART_LEGEND}>{title}</h3>
        {typeof aside === "string" ? (
          <span className="dex-font-display text-[11px] font-semibold tracking-[0.12em] text-radar/80 uppercase">{aside}</span>
        ) : (
          aside
        )}
      </div>
      {children}
    </div>
  );
}
