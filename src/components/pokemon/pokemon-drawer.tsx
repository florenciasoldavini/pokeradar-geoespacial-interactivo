"use client";

import Image from "next/image";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { StatBar } from "@/components/pokemon/stat-bar";
import { TypeBadge } from "@/components/pokemon/type-badge";
import { CloseIcon, PokeballIcon, SpeakerIcon } from "@/components/ui/icons";
import { WeatherIcon } from "@/components/weather/weather-icon";
import { DESKTOP_QUERY, useMediaQuery } from "@/hooks/use-media-query";
import { usePlayingCry } from "@/hooks/use-playing-cry";
import { usePokemonDetail } from "@/hooks/use-pokemon-detail";
import { TEAM_SIZE } from "@/hooks/use-team";
import { playCry } from "@/lib/cry-player";
import { STAT_LABELS, type PokemonDetail } from "@/lib/pokemon-detail";
import { TYPE_META } from "@/lib/pokemon-types";
import type { RadarSpawn } from "@/lib/spawn";
import { WEATHER_META } from "@/lib/weather";
import type { Zone } from "@/lib/zones";

/** Where the shown Pokémon stands relative to the expedition team. */
export type TeamStatus = "available" | "in-team" | "full";

type TeamActions = {
  status: TeamStatus;
  onCatch: () => void;
  onRelease: () => void;
};

type PokemonDrawerProps = {
  spawn: RadarSpawn | null;
  zone: Zone | null;
  team: TeamActions;
  onClose: () => void;
};

export function PokemonDrawer({ spawn, zone, team, onClose }: PokemonDrawerProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const dragControls = useDragControls();
  const offscreen = isDesktop ? { x: "110%" } : { y: "100%" };

  return (
    <AnimatePresence>
      {spawn && (
        <motion.aside
          key="pokemon-drawer"
          aria-labelledby="pokemon-drawer-title"
          initial={offscreen}
          animate={{ x: 0, y: 0 }}
          exit={offscreen}
          transition={{ type: "spring", stiffness: 280, damping: 32 }}
          // Mobile bottom sheet: drag the handle down to dismiss.
          drag={isDesktop ? false : "y"}
          dragListener={false}
          dragControls={dragControls}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.7 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 120 || info.velocity.y > 600) onClose();
          }}
          className="fixed inset-x-0 bottom-0 z-20 flex max-h-[78dvh] flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-panel/95 shadow-2xl backdrop-blur-xl md:inset-y-4 md:right-4 md:left-auto md:max-h-none md:w-[400px] md:rounded-3xl"
        >
          <div
            className="flex shrink-0 cursor-grab touch-none justify-center pt-3 pb-1 active:cursor-grabbing md:hidden"
            onPointerDown={(event) => dragControls.start(event)}
            aria-hidden
          >
            <span className="h-1 w-10 rounded-full bg-white/20" />
          </div>

          {/* Switching Pokémon crossfades the content, not the whole panel. */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={spawn.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
            >
              <DrawerContent
                spawn={spawn}
                zone={zone}
                team={team}
                onClose={onClose}
              />
            </motion.div>
          </AnimatePresence>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function DrawerContent({
  spawn,
  zone,
  team,
  onClose,
}: {
  spawn: RadarSpawn;
  zone: Zone | null;
  team: TeamActions;
  onClose: () => void;
}) {
  const detail = usePokemonDetail(spawn.id);
  const data = detail.status === "success" ? detail.data : null;
  const types = data?.types ?? spawn.types;
  const accent = types[0] ? TYPE_META[types[0]].color : "#5cf2a5";

  return (
    <div className="px-5 pb-6 md:pt-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] tracking-wider text-white/45 uppercase">
          N.º {String(spawn.id).padStart(3, "0")}
          {zone && <> · {zone.name}</>}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar detalle"
          className="grid size-8 cursor-pointer place-items-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <CloseIcon className="size-4" />
        </button>
      </div>

      {/* Hero: the animated map sprite holds the spot until the artwork loads. */}
      <div
        className="relative mt-2 grid h-48 place-items-center"
        style={{
          background: `radial-gradient(circle at 50% 60%, ${accent}33, transparent 65%)`,
        }}
      >
        {data?.artwork ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <Image
              src={data.artwork}
              alt={data.name}
              width={192}
              height={192}
              unoptimized
              className="size-48 object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
            />
          </motion.div>
        ) : spawn.sprite ? (
          <Image
            src={spawn.sprite}
            alt=""
            width={96}
            height={96}
            unoptimized
            className="size-24 animate-pulse object-contain [image-rendering:pixelated]"
          />
        ) : null}
      </div>

      <div className="mt-1 flex items-center gap-3">
        <h2
          id="pokemon-drawer-title"
          className="text-3xl font-semibold tracking-tight"
        >
          {data?.name ?? spawn.name}
        </h2>
        {spawn.cry && <CryButton id={spawn.id} url={spawn.cry} />}
      </div>
      {detail.status === "loading" ? (
        <Skeleton className="mt-2 h-4 w-32" />
      ) : (
        data?.genus && <p className="mt-0.5 text-sm text-white/55">{data.genus}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {types.map((type) => (
          <TypeBadge key={type} type={type} />
        ))}
        {data?.isLegendary && <RarityBadge label="Legendario" />}
        {data?.isMythical && <RarityBadge label="Singular" />}
      </div>

      <CaptureButton team={team} />

      {spawn.boostedBy && <WeatherNote spawn={spawn} />}

      {detail.status === "loading" && <DetailSkeleton />}
      {detail.status === "error" && <DetailError onRetry={detail.retry} />}
      {data && <DetailBody data={data} accent={accent} />}
    </div>
  );
}

function DetailBody({ data, accent }: { data: PokemonDetail; accent: string }) {
  const total = data.stats.reduce((sum, stat) => sum + stat.value, 0);

  return (
    <>
      {data.description && (
        <p className="mt-5 text-sm leading-relaxed text-white/75">
          {data.description}
        </p>
      )}

      <section className="mt-6">
        <div className="flex items-baseline justify-between">
          <h3 className="font-mono text-[11px] tracking-wider text-white/45 uppercase">
            Estadísticas base
          </h3>
          <span className="font-mono text-xs text-white/45">
            Total <span className="text-white/80 tabular-nums">{total}</span>
          </span>
        </div>
        <dl className="mt-3 space-y-2.5">
          {data.stats.map((stat, index) => (
            <StatBar
              key={stat.name}
              label={STAT_LABELS[stat.name]}
              value={stat.value}
              color={accent}
              index={index}
            />
          ))}
        </dl>
      </section>

      <dl className="mt-6 grid grid-cols-2 gap-3">
        <InfoTile label="Altura" value={`${data.heightM.toFixed(1)} m`} />
        <InfoTile label="Peso" value={`${data.weightKg.toFixed(1)} kg`} />
        <div className="col-span-2 rounded-xl border border-white/8 bg-white/3 p-3">
          <dt className="font-mono text-[11px] tracking-wider text-white/45 uppercase">
            Habilidades
          </dt>
          <dd className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-sm">
            {data.abilities.map((ability) => (
              <span key={ability.name}>
                {ability.name}
                {ability.hidden && (
                  <span className="ml-1 text-xs text-white/40">(oculta)</span>
                )}
              </span>
            ))}
          </dd>
        </div>
      </dl>
    </>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/3 p-3">
      <dt className="font-mono text-[11px] tracking-wider text-white/45 uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function CryButton({ id, url }: { id: number; url: string }) {
  const playing = usePlayingCry() === id;
  return (
    <button
      type="button"
      onClick={() => playCry(id, url)}
      aria-label="Escuchar su grito"
      title="Escuchar su grito"
      className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border border-white/10 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
    >
      {playing ? (
        // Little equalizer while the cry plays.
        <span className="flex h-3.5 items-end gap-[3px]" aria-hidden>
          {[0, 1, 2].map((bar) => (
            <motion.span
              key={bar}
              className="w-[3px] origin-bottom rounded-full bg-radar"
              style={{ height: "100%" }}
              animate={{ scaleY: [0.3, 1, 0.5, 0.9, 0.3] }}
              transition={{ duration: 0.7, repeat: Infinity, delay: bar * 0.12 }}
            />
          ))}
        </span>
      ) : (
        <SpeakerIcon className="size-4" />
      )}
    </button>
  );
}

function CaptureButton({ team }: { team: TeamActions }) {
  return (
    <div className="mt-4 flex items-center gap-3">
      <AnimatePresence mode="wait" initial={false}>
        {team.status === "in-team" ? (
          <motion.div
            key="in-team"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-1 items-center justify-between rounded-full border border-radar/40 bg-radar/10 py-2 pr-2 pl-4"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-radar">
              <PokeballIcon className="size-4" />
              En tu equipo
            </span>
            <button
              type="button"
              onClick={team.onRelease}
              className="cursor-pointer rounded-full px-3 py-1 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              Liberar
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="catch"
            type="button"
            onClick={team.onCatch}
            disabled={team.status === "full"}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileTap={{ scale: 0.96 }}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-radar py-2.5 text-sm font-semibold text-radar-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
          >
            <PokeballIcon className="size-4" />
            {team.status === "full"
              ? `Equipo completo (${TEAM_SIZE}/${TEAM_SIZE})`
              : "Capturar"}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Explains the radar's weather logic right where the player meets it. */
function WeatherNote({ spawn }: { spawn: RadarSpawn }) {
  if (!spawn.boostedBy) return null;
  const weather = WEATHER_META[spawn.boostedBy];
  const condition = weather.label.toLowerCase();
  return (
    <p
      className="mt-4 flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm"
      style={{ borderColor: `${weather.color}40`, backgroundColor: `${weather.color}10` }}
    >
      <span style={{ color: weather.color }}>
        <WeatherIcon kind={spawn.boostedBy} className="mt-0.5 size-4 shrink-0" />
      </span>
      <span className="text-white/75">
        {spawn.isVisitor ? (
          <>
            <strong className="font-medium text-white">Visitante.</strong> No
            vive en este hábitat: llegó atraído por el clima ({condition}).
          </>
        ) : (
          <>
            <strong className="font-medium text-white">Potenciado.</strong> El
            clima actual ({condition}) favorece a su tipo.
          </>
        )}
      </span>
    </p>
  );
}

function RarityBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-amber-300/40 bg-amber-300/10 px-2.5 py-0.5 text-xs font-medium text-amber-200">
      ★ {label}
    </span>
  );
}

function Skeleton({ className }: { className: string }) {
  return (
    <span
      aria-hidden
      className={`block animate-pulse rounded-md bg-white/8 ${className}`}
    />
  );
}

/** Mirrors DetailBody's layout so nothing jumps when data arrives. */
function DetailSkeleton() {
  return (
    <div role="status" aria-label="Cargando datos del Pokémon">
      <div className="mt-5 space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-11/12" />
        <Skeleton className="h-3.5 w-2/3" />
      </div>
      <Skeleton className="mt-6 h-3 w-32" />
      <div className="mt-3 space-y-3.5">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="grid grid-cols-[5.5rem_2.25rem_1fr] items-center gap-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-1.5 w-full" />
          </div>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Skeleton className="h-[4.25rem] w-full rounded-xl" />
        <Skeleton className="h-[4.25rem] w-full rounded-xl" />
        <Skeleton className="col-span-2 h-[4.25rem] w-full rounded-xl" />
      </div>
    </div>
  );
}

function DetailError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/5 p-4 text-center"
    >
      <p className="font-mono text-[11px] tracking-wider text-red-300 uppercase">
        Señal perdida
      </p>
      <p className="mt-1 text-sm text-white/65">
        No pudimos contactar a la PokéAPI. Revisá tu conexión e intentá de nuevo.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 cursor-pointer rounded-full border border-white/15 px-4 py-1.5 text-sm transition-colors hover:bg-white/10"
      >
        Reintentar
      </button>
    </div>
  );
}
