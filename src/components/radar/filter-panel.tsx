"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CloseIcon, FilterIcon } from "@/components/ui/icons";
import { RangeSlider } from "@/components/ui/range-slider";
import {
  DEFAULT_FILTERS,
  GENERATIONS,
  STAT_TOTAL_BOUNDS,
  activeFilterCount,
  toggled,
  type RadarFilters,
} from "@/lib/filters";
import { POKEMON_TYPES, TYPE_META } from "@/lib/pokemon-types";

type FilterPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: RadarFilters;
  onChange: (filters: RadarFilters) => void;
  /** Live feedback: how many Pokémon (and zones) the filters leave. */
  matchCount: number;
  zoneCount: number;
};

export function FilterPanel({
  open,
  onOpenChange,
  filters,
  onChange,
  matchCount,
  zoneCount,
}: FilterPanelProps) {
  const active = activeFilterCount(filters);

  return (
    <div className="pointer-events-auto relative">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        aria-label="Filtros"
        aria-controls="filter-panel"
        className="flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-panel/80 px-3 text-sm backdrop-blur-md transition-colors hover:bg-white/10 sm:h-10 sm:px-4"
      >
        <FilterIcon className="size-4" />
        <span className="hidden sm:inline">Filtros</span>
        <AnimatePresence>
          {active > 0 && (
            <motion.span
              key="count"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="grid size-5 place-items-center rounded-full bg-radar font-mono text-[11px] font-semibold text-radar-bg tabular-nums"
            >
              {active}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="filter-panel"
            role="dialog"
            aria-label="Filtros del radar"
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute top-11 right-0 sm:top-12 z-30 w-[min(22rem,calc(100vw-2rem))] origin-top-right rounded-2xl border border-white/10 bg-panel/95 p-4 shadow-2xl backdrop-blur-xl"
          >
            <div className="-mt-1 mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Filtros</h2>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Cerrar filtros"
                className="-mr-1.5 grid size-8 cursor-pointer place-items-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              >
                <CloseIcon className="size-4" />
              </button>
            </div>
            <FilterSection title="Tipo">
              <div className="flex flex-wrap gap-1.5">
                {POKEMON_TYPES.map((type) => {
                  const selected = filters.types.includes(type);
                  const { label, color } = TYPE_META[type];
                  return (
                    <motion.button
                      key={type}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        onChange({ ...filters, types: toggled(filters.types, type) })
                      }
                      whileTap={{ scale: 0.92 }}
                      animate={{
                        backgroundColor: selected ? `${color}33` : "rgba(255,255,255,0.03)",
                        borderColor: selected ? color : "rgba(255,255,255,0.1)",
                        color: selected ? color : "rgba(255,255,255,0.6)",
                      }}
                      transition={{ duration: 0.15 }}
                      className="cursor-pointer rounded-full border px-2.5 py-1 text-xs font-medium"
                    >
                      {label}
                    </motion.button>
                  );
                })}
              </div>
            </FilterSection>

            <FilterSection title="Generación">
              <div className="grid grid-cols-3 gap-1.5">
                {GENERATIONS.map((generation) => {
                  const selected = filters.generations.includes(generation.value);
                  return (
                    <button
                      key={generation.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        onChange({
                          ...filters,
                          generations: toggled(filters.generations, generation.value),
                        })
                      }
                      className={`cursor-pointer rounded-xl border px-2 py-2 text-left transition-colors ${
                        selected
                          ? "border-radar/60 bg-radar/10 text-radar"
                          : "border-white/10 bg-white/3 text-white/60 hover:bg-white/8"
                      }`}
                    >
                      <span className="block font-mono text-sm font-semibold">
                        {generation.label}
                      </span>
                      <span className="text-[11px] opacity-80">{generation.region}</span>
                    </button>
                  );
                })}
              </div>
            </FilterSection>

            <FilterSection
              title="Total de estadísticas base"
              aside={
                <span className="font-mono text-xs text-white/70 tabular-nums">
                  {filters.statTotal[0]} – {filters.statTotal[1]}
                </span>
              }
            >
              <RangeSlider
                min={STAT_TOTAL_BOUNDS.min}
                max={STAT_TOTAL_BOUNDS.max}
                step={STAT_TOTAL_BOUNDS.step}
                value={filters.statTotal}
                onChange={(statTotal) => onChange({ ...filters, statTotal })}
                labels={["Total mínimo", "Total máximo"]}
              />
            </FilterSection>

            <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3">
              <p className="text-xs text-white/55" aria-live="polite">
                <span className="font-medium text-white tabular-nums">{matchCount}</span>{" "}
                Pokémon en{" "}
                <span className="font-medium text-white tabular-nums">{zoneCount}</span>{" "}
                {zoneCount === 1 ? "zona" : "zonas"}
              </p>
              <button
                type="button"
                onClick={() => onChange(DEFAULT_FILTERS)}
                disabled={active === 0}
                className="cursor-pointer text-xs text-white/55 transition-colors hover:text-white disabled:cursor-default disabled:opacity-40 disabled:hover:text-white/55"
              >
                Limpiar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterSection({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <fieldset className="mt-4 first:mt-0">
      <div className="mb-2 flex items-baseline justify-between">
        <legend className="font-mono text-[11px] tracking-wider text-white/45 uppercase">
          {title}
        </legend>
        {aside}
      </div>
      {children}
    </fieldset>
  );
}
