"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Sprite } from "@/components/pokemon/sprite";
import { TypeBadge } from "@/components/pokemon/type-badge";
import { TypeIcon } from "@/components/pokemon/type-icon";
import { PokeballIcon } from "@/components/ui/icons";
import { WeatherIcon } from "@/components/weather/weather-icon";
import { usePlayingCry } from "@/hooks/use-playing-cry";
import { usePokemonDetail, type DetailState } from "@/hooks/use-pokemon-detail";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { TEAM_SIZE } from "@/hooks/use-team";
import { playCry } from "@/lib/cry-player";
import { STAT_LABELS, type PokemonDetail } from "@/lib/pokemon-detail";
import { TYPE_META, generationOf } from "@/lib/pokemon-types";
import type { RadarSpawn } from "@/lib/spawn";
import { defensiveMatchups } from "@/lib/type-chart";
import { WEATHER_META } from "@/lib/weather";
import type { Zone } from "@/lib/zones";
import { BoostMark, CART_LEGEND, Cartridge, GREEN_KEY, Lcd, WaveIcon, keyClass, type Placement } from "@/components/device/parts";

export type TeamStatus = "available" | "in-team" | "full";

type PokemonDrawerProps = {
  placement: Placement;
  screenHeight: number;
  spawn: RadarSpawn;
  zone: Zone;
  zoneSpawns: readonly RadarSpawn[];
  teamStatus: TeamStatus;
  teamCount: number;
  onCatch: () => void;
  onRelease: () => void;
  onOpenTeam: () => void;
  onSelectPokemon: (pokemonId: number) => void;
  onClose: () => void;
  /** Off while the manual is up, so C and G don't fire behind it. */
  keysEnabled: boolean;
};

const ROMAN = { 1: "I", 2: "II", 3: "III" } as const;
/** Highest base stat in Gen I–III (Blissey's PS) sets the bars' scale. */
const MAX_STAT = 255;
const NUMBER = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });

/**
 * The Pokémon cartridge, read top to bottom: who it is, the one thing to
 * do (capture), then the Pokédex entry, stats and facts from PokéAPI.
 */
export function PokemonDrawer(props: PokemonDrawerProps) {
  const { spawn, zone, zoneSpawns, onSelectPokemon, teamStatus, keysEnabled } = props;
  const detail = usePokemonDetail(spawn.id);
  const data = detail.status === "success" ? detail.data : null;
  const crying = usePlayingCry() === spawn.id;
  const cryUrl = data?.cry ?? spawn.cry;
  const name = data?.name ?? spawn.name;

  function cry() {
    if (cryUrl) playCry(spawn.id, cryUrl);
  }

  // C capture, G cry, [ ] walk the zone's roster.
  useEffect(() => {
    if (!keysEnabled) return;
    function onKeyDown(event: KeyboardEvent) {
      // Spanish and Latin American layouts type [ ] with AltGr / Option,
      // so those two keys are matched by the character, modifiers or not.
      const bracket = event.key === "[" || event.key === "]";
      if (event.metaKey || (!bracket && (event.ctrlKey || event.altKey)) || isTyping(event.target)) return;
      const index = zoneSpawns.findIndex((s) => s.id === spawn.id);
      const step = (by: number) => zoneSpawns[(index + by + zoneSpawns.length) % zoneSpawns.length];
      const key = event.key.toLowerCase();
      if (key === "c" && teamStatus === "available") props.onCatch();
      else if (key === "g") cry();
      else if (key === "[") onSelectPokemon(step(-1)?.id ?? spawn.id);
      else if (key === "]") onSelectPokemon(step(1)?.id ?? spawn.id);
      else return;
      event.preventDefault();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <Cartridge
      id="bz-ficha"
      placement={props.placement}
      screenHeight={props.screenHeight}
      label={`N.º ${String(spawn.id).padStart(3, "0")} · ${name}`}
      aside={`GEN ${ROMAN[generationOf(spawn.id)]}`}
      led="#5cf2a5"
      ariaLabel={`Ficha de ${name}`}
      closeLabel="Cerrar la ficha"
      onClose={props.onClose}
      expandable
    >
      <Hero spawn={spawn} zone={zone} detail={detail} />

      <div className="shrink-0">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <CaptureKey status={teamStatus} name={name} onCatch={props.onCatch} onRelease={props.onRelease} />
          <button
            type="button"
            onClick={cry}
            disabled={!cryUrl}
            aria-label={`Escuchar el grito de ${name}`}
            title="Escuchar su grito (G)"
            className={`${keyClass(crying)} flex h-11 items-center gap-2 rounded-xl px-3.5 text-sm font-medium disabled:opacity-40`}
          >
            {crying ? <Equalizer /> : <WaveIcon className="size-4" />}
            Grito
          </button>
        </div>
        <TeamLine status={teamStatus} count={props.teamCount} onOpenTeam={props.onOpenTeam} />
      </div>

      {detail.status === "error" ? (
        <>
          <Lcd className="shrink-0">
            <SignalLost onRetry={detail.retry} />
          </Lcd>
          {/* Computed from the types the radar already has, so it survives a failed fetch. */}
          <Matchups types={spawn.types} />
        </>
      ) : (
        <>
          <Lcd className="shrink-0 px-3.5 py-3">
            <p className="dex-font-lcd text-[11px] tracking-[0.12em] text-radar/80 uppercase">Entrada de la Pokédex</p>
            {data ? (
              <p className="mt-1.5 text-[13.5px] leading-[1.55] text-white/90">
                {data.description ?? "La PokéAPI no tiene una entrada en español para esta especie."}
              </p>
            ) : (
              <div className="mt-2.5 space-y-2" aria-label="Cargando la entrada">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-[92%]" />
                <Skeleton className="h-3 w-3/5" />
              </div>
            )}
          </Lcd>
          <Stats key={data?.id ?? "loading"} data={data} />
          <Matchups types={spawn.types} />
          <Facts data={data} />
        </>
      )}
    </Cartridge>
  );
}

function Hero({ spawn, zone, detail }: { spawn: RadarSpawn; zone: Zone; detail: DetailState }) {
  const reduce = useReducedMotion();
  const data = detail.status === "success" ? detail.data : null;
  const types = data?.types ?? spawn.types;
  const accent = types[0] ? TYPE_META[types[0]].color : "#5cf2a5";
  const digits = String(spawn.id).padStart(4, "0");
  const lead = digits.length - String(spawn.id).length;

  return (
    <Lcd className="shrink-0 px-3.5 pt-2.5 pb-3">
      <div className="dex-font-lcd flex items-baseline gap-2 text-[11px] tracking-[0.1em] text-radar/65 uppercase max-lg:hidden">
        <span className="text-xl leading-none tabular-nums" aria-hidden>
          <span className="text-radar/30">{digits.slice(0, lead)}</span>
          <span className="dex-lcd-text">{digits.slice(lead)}</span>
        </span>
        <span>Gen {ROMAN[generationOf(spawn.id)]}</span>
        <span className="ml-auto truncate">{zone.name}</span>
      </div>

      <motion.div
        key={spawn.id}
        initial={reduce ? false : { opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="mt-1 grid grid-cols-[92px_minmax(0,1fr)] items-center gap-3 lg:grid-cols-[112px_minmax(0,1fr)]"
      >
        <div className="relative grid size-[92px] place-items-center lg:size-28">
          <span
            aria-hidden
            className="absolute inset-2 rounded-full shadow-[inset_0_0_0_1px_rgb(92_242_165/0.14)]"
            style={{ background: `radial-gradient(circle, ${accent}2e, transparent 70%)` }}
          />
          {data?.artwork ? (
            <motion.span
              className="relative block"
              initial={reduce ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
            >
              <Sprite
                src={data.artwork}
                alt={data.name}
                width={112}
                height={112}
                className="size-[92px] object-contain lg:size-28"
              />
            </motion.span>
          ) : spawn.sprite ? (
            // The map sprite holds the spot while the scan completes.
            <Sprite
              src={spawn.sprite}
              alt=""
              width={64}
              height={64}
              className="relative size-16 animate-pulse object-contain [image-rendering:pixelated]"
            />
          ) : null}
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-[26px] leading-[1.05] font-bold tracking-tight text-white max-lg:text-[23px]">
            {data?.name ?? spawn.name}
          </h2>
          {detail.status === "loading" ? (
            <Skeleton className="mt-2 mb-2.5 h-3 w-28" />
          ) : (
            <p className="mt-1 mb-2 truncate text-[13px] text-white/65">{data?.genus ?? " "}</p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {types.map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
            {data?.isLegendary && <RarityBadge label="Legendario" />}
            {data?.isMythical && <RarityBadge label="Singular" />}
          </div>
        </div>
      </motion.div>

      <WeatherLine spawn={spawn} zone={zone} />
    </Lcd>
  );
}

function WeatherLine({ spawn, zone }: { spawn: RadarSpawn; zone: Zone }) {
  if (!spawn.boostedBy) {
    return (
      <p className="mt-2.5 border-t border-radar/15 pt-2 text-xs text-white/55">
        El clima de hoy no lo potencia.
      </p>
    );
  }
  const weather = WEATHER_META[spawn.boostedBy];
  const helped = spawn.types.filter((type) => weather.boosts.includes(type)).map((type) => TYPE_META[type].label);
  return (
    <p className="mt-2.5 flex items-start gap-2 border-t border-radar/15 pt-2 text-[12.5px] leading-snug text-white/80">
      {/* Same order as the map badge: the weather, then the boost it gives. */}
      <span className="mt-px flex shrink-0 items-center gap-0.5">
        <span style={{ color: weather.color }} className="flex">
          <WeatherIcon kind={spawn.boostedBy} className="size-4" />
        </span>
        {!spawn.isVisitor && <BoostMark className="size-3.5" />}
      </span>
      {spawn.isVisitor ? (
        <span>
          <b className="font-semibold text-white">Visitante:</b> no vive en {zone.name}; lo trajo el clima (
          {weather.label.toLowerCase()}).
        </span>
      ) : (
        <span>
          <b className="font-semibold text-white">Potenciado:</b> el clima ({weather.label.toLowerCase()}) favorece a{" "}
          {joinAnd(helped)}.
        </span>
      )}
    </p>
  );
}

function CaptureKey({
  status,
  name,
  onCatch,
  onRelease,
}: {
  status: TeamStatus;
  name: string;
  onCatch: () => void;
  onRelease: () => void;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      key={status}
      initial={reduce ? false : { opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="h-11 min-w-0"
    >
      {status === "in-team" ? (
        // Latched: the key stays sunk in while it's on the team.
        <div className="dex-recess flex h-full items-center justify-between gap-2 rounded-xl pr-1.5 pl-3">
          <span className="dex-font-lcd dex-lcd-text flex min-w-0 items-center gap-2 text-sm uppercase">
            <PokeballIcon className="size-4 shrink-0" />
            <span className="truncate">En tu equipo</span>
          </span>
          <button
            type="button"
            onClick={onRelease}
            aria-label={`Liberar a ${name}`}
            className={`${keyClass()} h-8 shrink-0 rounded-lg px-3 text-xs font-medium`}
          >
            Liberar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onCatch}
          disabled={status === "full"}
          title={status === "full" ? "Liberá a uno de tu equipo para capturar" : "Capturar (C)"}
          className={`${GREEN_KEY} flex size-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold`}
        >
          <PokeballIcon className="size-[18px]" />
          {status === "full" ? `Equipo completo` : "Capturar"}
          {status === "available" && (
            <kbd className="dex-font-lcd ml-1 rounded-[4px] bg-[#04281a]/15 px-1.5 py-0.5 text-[11px] leading-none max-lg:hidden">
              C
            </kbd>
          )}
        </button>
      )}
    </motion.div>
  );
}

function TeamLine({ status, count, onOpenTeam }: { status: TeamStatus; count: number; onOpenTeam: () => void }) {
  return (
    <p className="mt-2 flex items-center gap-2 text-[12.5px] text-white/65">
      <span className="flex gap-1" aria-hidden>
        {Array.from({ length: TEAM_SIZE }, (_, slot) => (
          <span
            key={slot}
            className={`size-2 rounded-full ${
              slot < count ? "bg-radar shadow-[0_0_6px_rgb(92_242_165/0.6)]" : "bg-black/45 shadow-[inset_0_1px_2px_rgb(0_0_0/0.6)]"
            }`}
          />
        ))}
      </span>
      <span className="dex-font-lcd dex-lcd-text text-xs tabular-nums">
        {count}/{TEAM_SIZE}
      </span>
      <span className="min-w-0 truncate">
        {status === "full" ? "Liberá a uno para hacer lugar." : status === "in-team" ? "Ya está en tu equipo." : "en tu equipo"}
      </span>
      {status === "full" && (
        <button
          type="button"
          onClick={onOpenTeam}
          className="ml-auto shrink-0 cursor-pointer text-xs font-medium text-radar underline-offset-2 hover:underline"
        >
          Ver equipo
        </button>
      )}
    </p>
  );
}

function Stats({ data }: { data: PokemonDetail | null }) {
  const total = data?.stats.reduce((sum, stat) => sum + stat.value, 0) ?? 0;
  return (
    <Lcd className="shrink-0 px-3.5 py-2.5">
      <h3 className="sr-only">Estadísticas base</h3>
      <dl className="grid gap-1 max-lg:grid-cols-2 max-lg:gap-x-4 max-lg:gap-y-1.5">
        {(data?.stats ?? PLACEHOLDER_STATS).map((stat, i) => (
          <div key={stat.name} className="grid grid-cols-[66px_30px_1fr] items-center gap-2 text-[12.5px] max-lg:grid-cols-[58px_26px_1fr]">
            <dt className="truncate text-white/75">{STAT_LABELS[stat.name]}</dt>
            <dd className="dex-font-lcd dex-lcd-text text-right text-[13px] tabular-nums">{data ? stat.value : "--"}</dd>
            <dd className="h-[7px] overflow-hidden rounded-[2px] bg-radar/8" aria-hidden>
              {data ? (
                <span
                  className="bz-bar block h-full"
                  style={{ width: `${Math.min(stat.value / MAX_STAT, 1) * 100}%`, animationDelay: `${i * 30}ms` }}
                />
              ) : (
                <span className="block h-full w-1/2 animate-pulse bg-radar/12" />
              )}
            </dd>
          </div>
        ))}
      </dl>
      <p className="dex-font-lcd mt-2 flex justify-between border-t border-radar/15 pt-2 text-xs tracking-[0.1em] text-radar/70">
        <span>TOTAL</span>
        <span className="dex-lcd-text tabular-nums">{data ? total : "---"}</span>
      </p>
    </Lcd>
  );
}

const PLACEHOLDER_STATS = (Object.keys(STAT_LABELS) as (keyof typeof STAT_LABELS)[]).map((name) => ({ name, value: 0 }));

function Facts({ data }: { data: PokemonDetail | null }) {
  const abilities = data?.abilities.filter((a) => !a.hidden).map((a) => a.name) ?? [];
  const facts = [
    { label: "Altura", value: data ? `${NUMBER.format(data.heightM)} m` : null },
    { label: "Peso", value: data ? `${NUMBER.format(data.weightKg)} kg` : null },
    { label: "Habilidad", value: data ? abilities.join(", ") || "—" : null },
  ];
  return (
    <dl className="grid shrink-0 grid-cols-[1fr_1fr_1.4fr] gap-1.5">
      {facts.map((fact) => (
        <div key={fact.label} className="dex-lcd min-w-0 rounded-[10px] px-2.5 py-2">
          <dt className={`${CART_LEGEND} text-[10px]`}>{fact.label}</dt>
          <dd className="dex-font-lcd dex-lcd-text mt-1.5 truncate text-[15px] leading-none" title={fact.value ?? undefined}>
            {fact.value ?? <Skeleton className="h-3.5 w-12" />}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * What each attacking type does to this Pokémon, both of its types counted.
 * Three plain rows; only the extremes (×4, ×¼) carry a number. Neutral
 * types are left out.
 */
function Matchups({ types }: { types: RadarSpawn["types"] }) {
  const groups = defensiveMatchups(types);
  const rows = [
    { label: "Débil a", tone: "text-red-300", match: (m: number) => m > 1, tag: 4, tagText: "×4" },
    { label: "Resiste", tone: "text-radar", match: (m: number) => m > 0 && m < 1, tag: 0.25, tagText: "×¼" },
    { label: "Inmune a", tone: "text-sky-200", match: (m: number) => m === 0, tag: null, tagText: "" },
  ]
    .map((row) => ({
      ...row,
      entries: groups
        .filter((group) => row.match(group.multiplier))
        .flatMap((group) => group.types.map((type) => ({ type, multiplier: group.multiplier }))),
    }))
    .filter((row) => row.entries.length > 0);

  return (
    <Lcd className="shrink-0 px-3.5 py-3">
      <p className="dex-font-lcd text-[11px] tracking-[0.12em] text-radar/80 uppercase">Daño recibido por tipo</p>
      <dl className="mt-2 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2">
        {rows.map(({ label, tone, tag, tagText, entries }) => (
          <div key={label} className="contents">
            <dt className={`dex-font-lcd text-xs whitespace-nowrap ${tone}`}>{label}</dt>
            <dd className="flex flex-wrap items-center gap-1.5">
              {entries.map(({ type, multiplier }) => (
                <span key={type} className="inline-flex items-center gap-0.5">
                  <TypeIcon type={type} size={20} tooltip="above" />
                  {multiplier === tag && (
                    <span className={`dex-font-lcd text-[10px] leading-none ${tone}`} aria-label={`(${tagText})`}>
                      {tagText}
                    </span>
                  )}
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </Lcd>
  );
}

function SignalLost({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="grid place-items-center gap-2 px-4 py-6 text-center">
      <p className="dex-font-lcd text-xs tracking-[0.14em] text-red-400 uppercase [text-shadow:0_0_8px_rgb(248_113_113/0.5)]">
        ▲ Señal perdida
      </p>
      <p className="max-w-[30ch] text-sm text-white/75">
        No pudimos leer su entrada, estadísticas y datos desde la PokéAPI. Revisá tu conexión.
      </p>
      <button type="button" onClick={onRetry} className={`${keyClass()} mt-1 h-9 rounded-full px-4 text-sm font-medium`}>
        Reintentar
      </button>
    </div>
  );
}

/** Same shape as a TypeBadge: a white symbol on a colored disc, then the label. */
function RarityBadge({ label }: { label: string }) {
  return (
    <span className="dex-font-lcd inline-flex items-center gap-1.5 rounded-full border border-amber-300/45 bg-amber-300/10 py-0.5 pr-2.5 pl-1 text-xs text-amber-200">
      <span aria-hidden className="grid size-4 shrink-0 place-items-center rounded-full bg-amber-400">
        <svg viewBox="0 0 24 24" className="size-2.5 fill-white">
          <path d="M12 2.5l2.9 6.2 6.8.8-5 4.6 1.3 6.7L12 17.5l-6 3.3 1.3-6.7-5-4.6 6.8-.8z" />
        </svg>
      </span>
      {label}
    </span>
  );
}

function Skeleton({ className }: { className: string }) {
  return <span aria-hidden className={`block animate-pulse rounded-[3px] bg-radar/12 ${className}`} />;
}

function Equalizer() {
  const reduce = useReducedMotion();
  return (
    <span className="flex size-4 items-end justify-center gap-[2px]" aria-hidden>
      {[0, 1, 2].map((bar) => (
        <motion.span
          key={bar}
          className="h-full w-[3px] origin-bottom rounded-full bg-radar"
          animate={reduce ? { scaleY: 0.7 } : { scaleY: [0.3, 1, 0.5, 0.9, 0.3] }}
          transition={reduce ? { duration: 0 } : { duration: 0.7, repeat: Infinity, delay: bar * 0.12 }}
        />
      ))}
    </span>
  );
}

function joinAnd(items: readonly string[]) {
  if (items.length <= 1) return items[0] ?? "su tipo";
  return `${items.slice(0, -1).join(", ")} y ${items.at(-1)}`;
}

export function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable || target.getAttribute("role") === "slider")
  );
}
