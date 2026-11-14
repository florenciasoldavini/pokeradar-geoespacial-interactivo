"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Grille, Led, Lens, LidSeam } from "@/components/device/hardware";
import { Sprite } from "@/components/pokemon/sprite";
import { FilterIcon, PokeballIcon, SpeakerIcon } from "@/components/ui/icons";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { TEAM_SIZE, type TeamMember } from "@/hooks/use-team";
import { plural } from "@/lib/format";
import { TYPE_META } from "@/lib/pokemon-types";
import { LEGEND, LightningIcon, Triangle, keyClass, pad2 } from "@/components/device/parts";

export type Panel = "filters" | "track" | "team" | "manual";

export type Readout = {
  /** Breadcrumb, e.g. ["Argentina", "Iguazú", "N.º 025"]. */
  trail: readonly string[];
  /** Main line when no message is flashing. */
  line: string;
};

type WeatherStatus = "loading" | "error" | "ready";

/* ── Lid ───────────────────────────────────────────────────────────── */

type LidProps = {
  readout: Readout;
  message: { id: number; text: string } | null;
  weatherStatus: WeatherStatus;
  /** The lens breathes while a cry plays or the weather tunes in. */
  lensActive: boolean;
  soundOn: boolean;
  onToggleSound: () => void;
  filtersOpen: boolean;
  activeFilters: number;
  onToggleFilters: () => void;
  manualOpen: boolean;
  onOpenManual: () => void;
};

/**
 * The slim top of the device: lens, weather LEDs, brand, the LCD that says
 * where you are, and the two global keys. One row at every width.
 */
export function Lid(props: LidProps) {
  return (
    <header className="relative z-30 col-span-full flex min-w-0 items-center gap-2 px-2 pb-1 lg:gap-3 lg:pr-3 lg:pl-2.5">
      {/* Phones have no rail, so the lens doubles as the manual key. */}
      <button
        type="button"
        onClick={props.onOpenManual}
        aria-label="Abrir el manual"
        aria-expanded={props.manualOpen}
        title="Manual (?)"
        className="relative shrink-0 cursor-pointer rounded-full transition-transform duration-100 ease-out outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-95 lg:hidden"
      >
        <span className="-m-1.5 block scale-75">
          <Lens active={props.lensActive} />
        </span>
        <span
          aria-hidden
          className="dex-font-display absolute -right-1 -bottom-1 grid size-4 place-items-center rounded-full bg-[linear-gradient(170deg,#e9e6df,#bdb9af)] text-[10px] leading-none font-bold text-[#3b3530] shadow-[0_1px_0_rgb(0_0_0/0.4)]"
        >
          ?
        </span>
      </button>
      <span className="-m-1 hidden shrink-0 scale-[0.84] lg:block">
        <Lens active={props.lensActive} />
      </span>

      <WeatherLeds status={props.weatherStatus} />

      <p className="hidden shrink-0 flex-col lg:flex">
        <span className="dex-font-display text-[19px] leading-none font-bold tracking-tight text-white [text-shadow:0_1px_0_rgb(0_0_0/0.4)]">
          PokéRadar
        </span>
        <span className={`${LEGEND} mt-1 text-[9px]`}>Pokédex · Argentina</span>
      </p>

      <StatusLcd readout={props.readout} message={props.message} />

      <div className="ml-auto flex shrink-0 items-center gap-1.5 lg:gap-2">
        <button
          type="button"
          onClick={props.onToggleSound}
          aria-pressed={props.soundOn}
          aria-label="Sonido"
          title={props.soundOn ? "Sonido: activado (M)" : "Sonido: silenciado (M)"}
          className={`${keyClass(props.soundOn)} relative grid size-10 place-items-center rounded-xl`}
        >
          <SpeakerIcon muted={!props.soundOn} className="size-[18px]" />
          <span className="absolute top-1 right-1 flex">
            <Led color="#5cf2a5" on={props.soundOn} size={5} />
          </span>
        </button>
        <button
          type="button"
          onClick={props.onToggleFilters}
          aria-expanded={props.filtersOpen}
          aria-controls="bz-filters"
          aria-label={props.activeFilters > 0 ? `Filtros: ${props.activeFilters} activos` : "Filtros"}
          title="Filtros (F)"
          className={`${keyClass(props.filtersOpen)} relative flex h-10 min-w-10 items-center justify-center gap-2 rounded-xl px-2.5 lg:px-3`}
        >
          <FilterIcon className="size-[18px]" />
          <span className="dex-font-display hidden text-xs font-semibold tracking-[0.1em] uppercase lg:inline">
            Filtros
          </span>
          <AnimatePresence>
            {props.activeFilters > 0 && (
              <motion.span
                key="count"
                aria-hidden
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 26 }}
                className="dex-font-lcd grid h-[18px] min-w-[18px] place-items-center rounded-[4px] bg-radar px-1 text-xs leading-none text-[#06110c] tabular-nums shadow-[0_0_8px_rgb(92_242_165/0.6)] max-lg:absolute max-lg:-top-1.5 max-lg:-right-1.5"
              >
                {props.activeFilters}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
      <span className="pointer-events-none absolute inset-x-0 -bottom-1.5">
        <LidSeam />
      </span>
    </header>
  );
}

function WeatherLeds({ status }: { status: WeatherStatus }) {
  const text = status === "loading" ? "Sintonizando el clima" : status === "error" ? "Clima no disponible" : "Clima en vivo";
  return (
    <span className="flex shrink-0 flex-col gap-1 lg:flex-row lg:gap-1.5 lg:self-start lg:pt-2" title={text}>
      <Led color="#ef4444" on={status === "error"} size={7} />
      <Led color="#f59e0b" on={status === "loading"} blink size={7} />
      <Led color="#22c55e" on={status === "ready"} size={7} />
      <span className="sr-only">{text}</span>
    </span>
  );
}

/** Two-line LCD: where you are, then what's happening (or a flash message). */
function StatusLcd({ readout, message }: { readout: Readout; message: LidProps["message"] }) {
  const reduce = useReducedMotion();
  const line = message?.text ?? readout.line;
  return (
    <div className="dex-lcd h-11 min-w-0 flex-1 rounded-[8px] px-2.5 py-1 lg:ml-1 lg:h-[42px] lg:max-w-[440px] lg:px-3">
      <p className="dex-font-lcd truncate text-[10.5px] leading-[15px] text-radar/65 uppercase lg:text-[11px]">
        {readout.trail.map((step, i) => (
          <span key={`${i}:${step}`}>
            {i > 0 && <span className="text-radar/60"> › </span>}
            {step}
          </span>
        ))}
      </p>
      <div className="relative h-5 overflow-hidden" role="status" aria-live="polite">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.p
            key={message ? `m${message.id}` : `r:${readout.line}`}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className={`dex-font-lcd dex-lcd-text truncate text-[13px] leading-5 tracking-[0.03em] uppercase lg:text-[15px] lg:tracking-[0.06em] ${
              message ? "text-[#c9ffe3]" : ""
            }`}
          >
            {line}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Rail (desktop) ────────────────────────────────────────────────── */

type RailProps = {
  zoneIndex: number;
  zoneCount: number;
  onStepZone: (step: 1 | -1) => void;
  boostCount: number | null;
  trackOpen: boolean;
  onToggleTrack: () => void;
  teamCount: number;
  teamOpen: boolean;
  onToggleTeam: () => void;
  manualOpen: boolean;
  onOpenManual: () => void;
};

/** The left column of keys: zone rocker, rastreo, equipo and the manual. */
export function Rail(props: RailProps) {
  return (
    <nav
      aria-label="Teclas del Pokédex"
      className="relative z-20 row-span-2 hidden flex-col items-center gap-1.5 pt-3.5 pb-3 pl-2 lg:flex"
    >
      <ZoneRocker index={props.zoneIndex} count={props.zoneCount} onStep={props.onStepZone} />
      <span className={LEGEND}>Zona</span>

      <RailKey
        label={props.boostCount === null ? "Rastreo de potenciados" : `Rastreo: ${plural(props.boostCount, "potenciado")}`}
        title="Rastreo de potenciados (P)"
        expanded={props.trackOpen}
        controls="bz-track"
        onClick={props.onToggleTrack}
        className="mt-3"
      >
        <LightningIcon className="size-[18px] text-amber-300" />
        <span className="dex-font-lcd text-sm leading-none text-amber-200 tabular-nums [text-shadow:0_0_8px_rgb(251_191_36/0.45)]">
          {props.boostCount === null ? "--" : pad2(props.boostCount)}
        </span>
      </RailKey>
      <span className={LEGEND}>Rastreo</span>

      <RailKey
        label={`Equipo: ${props.teamCount} de ${TEAM_SIZE}`}
        title="Equipo y sus debilidades (E)"
        expanded={props.teamOpen}
        controls="bz-team"
        onClick={props.onToggleTeam}
        className="mt-3"
      >
        <PokeballIcon className="size-[18px]" />
        <span className="dex-font-lcd dex-lcd-text text-sm leading-none tabular-nums">
          {props.teamCount}/{TEAM_SIZE}
        </span>
      </RailKey>
      <span className={LEGEND}>Equipo</span>

      <div className="mt-auto flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={props.onOpenManual}
          aria-label="Abrir el manual"
          aria-expanded={props.manualOpen}
          title="Manual (?)"
          className={`${keyClass(props.manualOpen)} dex-font-display grid size-10 place-items-center rounded-full text-base font-semibold`}
        >
          ?
        </button>
        <Grille />
      </div>
    </nav>
  );
}

function RailKey({
  label,
  title,
  expanded,
  controls,
  onClick,
  className = "",
  children,
}: {
  label: string;
  title: string;
  expanded: boolean;
  controls: string;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-expanded={expanded}
      aria-controls={controls}
      title={title}
      className={`${keyClass(expanded)} grid size-[52px] content-center justify-items-center gap-1 rounded-xl ${className}`}
    >
      {children}
    </button>
  );
}

/** ▲ zone ▼: walks the zones north to south (also N and S). */
function ZoneRocker({ index, count, onStep }: { index: number; count: number; onStep: (step: 1 | -1) => void }) {
  return (
    <div role="group" aria-label="Zona" className="flex flex-col rounded-xl shadow-[0_0_0_1px_rgb(0_0_0/0.5)]">
      <button
        type="button"
        onClick={() => onStep(-1)}
        aria-label="Zona más al norte"
        title="Zona al norte (N)"
        className={`${keyClass()} grid h-[34px] w-[52px] place-items-center rounded-t-xl`}
      >
        <Triangle rotate={0} />
      </button>
      <p
        className="dex-lcd dex-font-lcd flex h-[30px] w-[52px] items-baseline justify-center border-y border-black/60 pt-[7px] text-sm leading-none tabular-nums"
        aria-label={index >= 0 ? `Zona ${index + 1} de ${count}` : "Ninguna zona elegida"}
      >
        <span className="dex-lcd-text">{index >= 0 ? pad2(index + 1) : "--"}</span>
        <span className="text-[11px] text-radar/75">/{pad2(count)}</span>
      </p>
      <button
        type="button"
        onClick={() => onStep(1)}
        aria-label="Zona más al sur"
        title="Zona al sur (S)"
        className={`${keyClass()} grid h-[34px] w-[52px] place-items-center rounded-b-xl`}
      >
        <Triangle rotate={180} />
      </button>
    </div>
  );
}

/* ── Team bay ──────────────────────────────────────────────────────── */

type TeamProps = {
  team: readonly TeamMember[];
  currentId: number | null;
  onSelectMember: (member: TeamMember) => void;
};

/**
 * Desktop: the strip under the screen, with the team sockets and the
 * audio LED.
 */
export function Bay({ team, currentId, onSelectMember, crying }: TeamProps & { crying: boolean }) {
  return (
    <footer
      aria-label="Equipo de expedición"
      className="relative z-20 hidden min-w-0 items-center gap-3.5 pr-1.5 pl-1.5 lg:flex xl:pr-4"
    >
      <Sockets team={team} currentId={currentId} onSelect={onSelectMember} className="max-xl:order-last max-xl:ml-auto" />
      <p className={`${LEGEND} hidden truncate xl:block`}>
        {team.length === 0
          ? "Capturá Pokémon para armar tu equipo de seis"
          : "Tocá un Pokémon del equipo para volar a donde lo capturaste"}
      </p>
      <span aria-hidden className="ml-auto hidden shrink-0 items-center gap-4 xl:flex">
        <span className="flex items-center gap-1.5">
          <Led color="#ef4444" on={crying} size={7} />
          <span className={`${LEGEND} text-[9px]`}>Audio</span>
        </span>
        <Grille />
      </span>
    </footer>
  );
}

type DockProps = TeamProps & {
  boostCount: number | null;
  trackOpen: boolean;
  onToggleTrack: () => void;
  teamOpen: boolean;
  onToggleTeam: () => void;
  onStepZone: (step: 1 | -1) => void;
};

/** Phones and tablets: rastreo, the team tray and the zone rocker in one row. */
export function Dock(props: DockProps) {
  return (
    <nav aria-label="Teclas del Pokédex" className="relative z-20 flex min-w-0 items-center gap-1 px-1.5 lg:hidden">
      <button
        type="button"
        onClick={props.onToggleTrack}
        aria-label={props.boostCount === null ? "Rastreo de potenciados" : `Rastreo: ${plural(props.boostCount, "potenciado")}`}
        aria-expanded={props.trackOpen}
        aria-controls="bz-track"
        className={`${keyClass(props.trackOpen)} grid h-[52px] w-[42px] shrink-0 content-center justify-items-center gap-1 rounded-xl`}
      >
        <LightningIcon className="size-[18px] text-amber-300" />
        <span className="dex-font-lcd text-[13px] leading-none text-amber-200 tabular-nums">
          {props.boostCount === null ? "--" : pad2(props.boostCount)}
        </span>
      </button>

      <Sockets
        team={props.team}
        currentId={props.currentId}
        onSelect={props.onSelectMember}
        className="mx-auto min-w-0"
        counter={{ open: props.teamOpen, onToggle: props.onToggleTeam }}
      />

      <div role="group" aria-label="Zona" className="flex shrink-0 flex-col rounded-xl shadow-[0_0_0_1px_rgb(0_0_0/0.5)]">
        <button
          type="button"
          onClick={() => props.onStepZone(-1)}
          aria-label="Zona más al norte"
          className={`${keyClass()} grid h-[26px] w-[42px] place-items-center rounded-t-xl border-b border-black/50`}
        >
          <Triangle rotate={0} />
        </button>
        <button
          type="button"
          onClick={() => props.onStepZone(1)}
          aria-label="Zona más al sur"
          className={`${keyClass()} grid h-[26px] w-[42px] place-items-center rounded-b-xl`}
        >
          <Triangle rotate={180} />
        </button>
      </div>
    </nav>
  );
}

/** Phones: the decorative chin under the dock. Nothing to tap here. */
export function Chin({ crying }: { crying: boolean }) {
  return (
    <div aria-hidden className="flex items-center justify-between px-5 lg:hidden">
      <span className="flex items-center gap-1.5">
        <Led color="#ef4444" on={crying} size={7} />
        <span className={`${LEGEND} text-[9px]`}>Audio</span>
      </span>
      <Grille />
    </div>
  );
}

function Sockets({
  team,
  currentId,
  onSelect,
  className = "",
  counter,
}: {
  team: readonly TeamMember[];
  currentId: number | null;
  onSelect: (member: TeamMember) => void;
  className?: string;
  /** Phones: the tray starts with the team count, which opens the analysis. */
  counter?: { open: boolean; onToggle: () => void };
}) {
  return (
    <div className={`dex-recess flex shrink items-center gap-[3px] rounded-full p-1 lg:gap-[5px] ${className}`}>
      {counter && (
        <button
          type="button"
          onClick={counter.onToggle}
          aria-expanded={counter.open}
          aria-controls="bz-team"
          aria-label={`Equipo: ${team.length} de ${TEAM_SIZE}. Ver sus debilidades`}
          className={`${keyClass(counter.open)} dex-font-lcd grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] leading-none tabular-nums`}
        >
          <span className="dex-lcd-text">
            {team.length}/{TEAM_SIZE}
          </span>
        </button>
      )}
      <ol aria-label="Equipo de expedición" className="flex min-w-0 gap-[3px] lg:gap-[5px]">
        {Array.from({ length: TEAM_SIZE }, (_, slot) => (
          <Socket key={slot} member={team[slot]} current={team[slot]?.id === currentId} onSelect={onSelect} />
        ))}
      </ol>
    </div>
  );
}

function Socket({
  member,
  current,
  onSelect,
}: {
  member: TeamMember | undefined;
  current: boolean;
  onSelect: (member: TeamMember) => void;
}) {
  const reduce = useReducedMotion();
  const color = member?.types[0] ? TYPE_META[member.types[0]].color : undefined;
  return (
    <li className="relative aspect-square w-9 min-w-0 shrink">
      <span
        aria-hidden
        className="absolute inset-0 grid place-items-center rounded-full bg-black/40 text-white/12 shadow-[inset_0_1px_3px_rgb(0_0_0/0.7)]"
      >
        <PokeballIcon className="size-[55%]" />
      </span>
      <AnimatePresence>
        {member && (
          <motion.button
            key={member.id}
            type="button"
            onClick={() => onSelect(member)}
            aria-label={`${member.name}: volar a donde lo capturaste`}
            aria-current={current ? "true" : undefined}
            title={member.name}
            initial={reduce ? { opacity: 0 } : { scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { scale: 0, opacity: 0, transition: { duration: 0.16 } }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 420, damping: 20 }}
            className="absolute inset-0 grid cursor-pointer place-items-center overflow-hidden rounded-full bg-[#06110c] outline-hidden focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-white"
            style={{
              boxShadow: current ? "0 0 0 2px #5cf2a5, 0 0 10px rgb(92 242 165 / 0.6)" : `0 0 0 1.5px ${color ?? "#5cf2a5"}aa`,
            }}
          >
            {member.sprite && (
              <Sprite
                src={member.sprite}
                alt=""
                width={32}
                height={32}
                // Out of flow, so a large sprite can't stretch the socket past its circle.
                className="absolute inset-0 m-auto size-[84%] object-contain [image-rendering:pixelated]"
              />
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </li>
  );
}
