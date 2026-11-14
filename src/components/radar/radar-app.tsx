"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bay, Chin, Dock, Lid, Rail, type Readout } from "@/components/device/chrome";
import { dexDisplay, dexLcd } from "@/components/device/fonts";
import { SHEET_PEEK, pad2, type Placement } from "@/components/device/parts";
import type { CameraPadding, CameraTarget } from "@/components/map/camera-controller";
import { MapLoader } from "@/components/map/map-loader";
import { PokemonDrawer, isTyping, type TeamStatus } from "@/components/pokemon/pokemon-drawer";
import { FilterPanel } from "@/components/radar/filter-panel";
import { Manual, useManualSeen } from "@/components/radar/manual";
import { TeamPanel } from "@/components/radar/team-panel";
import { TrackPanel } from "@/components/radar/track-panel";
import { ZoneCard } from "@/components/radar/zone-card";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePlayingCry } from "@/hooks/use-playing-cry";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { TEAM_SIZE, useTeam, type TeamMember } from "@/hooks/use-team";
import { useZoneWeather } from "@/hooks/use-zone-weather";
import { playCry } from "@/lib/cry-player";
import { DEFAULT_FILTERS, activeFilterCount, matchesFilters, type RadarFilters } from "@/lib/filters";
import { TYPE_META } from "@/lib/pokemon-types";
import { applyWeather } from "@/lib/radar-spawns";
import type { RadarSpawn, WeatherVisitors, ZoneSpawns } from "@/lib/spawn";
import { isSharedWeakness, teamThreats } from "@/lib/team-coverage";
import { WEATHER_META, type ZoneWeather } from "@/lib/weather";
import type { Zone } from "@/lib/zones";
import "@/components/device/device.css";

/** Cartridges docked over the screen, besides the manual. */
type Panel = "filters" | "track" | "team";
type CartKind = "zone" | "ficha" | "track" | "team" | "filters";

/** Desktop chrome (rail + side cartridges) from here up. */
const DESKTOP_QUERY = "(min-width: 64rem)";
/** Wide enough for the zone and the ficha side by side. */
const DUAL_QUERY = "(min-width: 80rem)";
/** Cartridge widths + their 12px inset + breathing room for the camera. */
const LEFT_PAD = 12 + 328 + 28;
const RIGHT_PAD = 12 + 372 + 28;
/** How much closer the camera gets when focusing a single Pokémon. */
const POKEMON_ZOOM_BOOST = 1.5;
const MESSAGE_MS = 2400;

type RadarAppProps = {
  zones: readonly Zone[];
  spawnsByZone: ZoneSpawns;
  weatherVisitors: WeatherVisitors;
};

/**
 * The radar as a pocket Pokédex, reorganised around the map. The hardware
 * lives at the edges (a slim lid, a rail of keys, a team bay) and every
 * detail is a cartridge that slides in from an edge of the lit screen,
 * while the camera keeps the radar in the part that stays free.
 */
export function RadarApp({ zones, spawnsByZone, weatherVisitors }: RadarAppProps) {
  const reduce = useReducedMotion();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const dual = useMediaQuery(DUAL_QUERY) && isDesktop;

  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedPokemonId, setSelectedPokemonId] = useState<number | null>(null);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [manualRequested, setManualRequested] = useState(false);
  const [filters, setFilters] = useState<RadarFilters>(DEFAULT_FILTERS);
  const [soundOn, setSoundOn] = useLocalStorage("pokeradar:sound", true, isBoolean);
  const { team, catchPokemon, release, isFull } = useTeam();
  const weather = useZoneWeather(zones);
  const weatherByZone = weather.status === "ready" ? weather.byZone : NO_WEATHER;
  const [manualSeen, markManualSeen] = useManualSeen();
  const { message, flash } = useTicker();
  const crying = usePlayingCry() !== null;
  const [screenRef, screenHeight] = useHeight<HTMLDivElement>();

  // ▲ ▼ walk the country like a map: north to south.
  const orderedZones = useMemo(() => [...zones].sort((a, b) => b.center[1] - a.center[1]), [zones]);

  // Weather applied to every zone, so country-level counts include visitors.
  const radarSpawnsByZone = useMemo(
    () =>
      Object.fromEntries(
        zones.map((zone) => [
          zone.id,
          applyWeather(zone, spawnsByZone[zone.id] ?? [], weatherByZone[zone.id] ?? null, weatherVisitors),
        ]),
      ) as Record<string, RadarSpawn[]>,
    [zones, spawnsByZone, weatherByZone, weatherVisitors],
  );

  const selectedZone = zones.find((zone) => zone.id === selectedZoneId) ?? null;
  const zoneIndex = orderedZones.findIndex((zone) => zone.id === selectedZoneId);
  const radarSpawns = useMemo(
    () => (selectedZone && radarSpawnsByZone[selectedZone.id]) || NO_SPAWNS,
    [selectedZone, radarSpawnsByZone],
  );
  const selectedSpawn = radarSpawns.find((spawn) => spawn.id === selectedPokemonId) ?? null;

  const activeFilters = activeFilterCount(filters);
  const filtering = activeFilters > 0;
  const matchCountByZone = useMemo(
    () =>
      Object.fromEntries(
        zones.map((zone) => [
          zone.id,
          (radarSpawnsByZone[zone.id] ?? []).filter((spawn) => matchesFilters(spawn, filters)).length,
        ]),
      ),
    [zones, radarSpawnsByZone, filters],
  );
  const matchingIds = useMemo(
    () =>
      filtering
        ? new Set(radarSpawns.filter((spawn) => matchesFilters(spawn, filters)).map((spawn) => spawn.id))
        : null,
    [filtering, radarSpawns, filters],
  );
  const counts = Object.values(matchCountByZone);
  const totalMatches = counts.reduce((sum, count) => sum + count, 0);
  const zonesWithMatches = counts.filter((count) => count > 0).length;

  // Rastreo: boosted Pokémon that pass the filters, zone by zone.
  const boostedByZone = useMemo(
    () =>
      Object.fromEntries(
        zones.map((zone) => [
          zone.id,
          (radarSpawnsByZone[zone.id] ?? []).filter((s) => s.boostedBy !== null && matchesFilters(s, filters)),
        ]),
      ) as Record<string, RadarSpawn[]>,
    [zones, radarSpawnsByZone, filters],
  );
  const countryBoosted = Object.values(boostedByZone).reduce((sum, list) => sum + list.length, 0);
  const zoneBoosted = (selectedZone && boostedByZone[selectedZone.id]) || NO_SPAWNS;
  const boostCount =
    weather.status !== "ready" ? null : selectedZone ? zoneBoosted.length : countryBoosted;

  const manualOpen = manualRequested || !manualSeen;
  const tracking = panel === "track";

  /* ── Which cartridges are in ──────────────────────────────────────── */

  // Desktop has a left and a right slot; wide screens fill both at once.
  const leftKind: CartKind | null =
    panel === "track" ? "track" : panel === "team" ? "team" : selectedZone ? "zone" : null;
  const rightKind: CartKind | null =
    panel === "filters" ? "filters" : selectedSpawn && !(tracking && !dual) ? "ficha" : null;
  // Narrower screens: one cartridge, the one you opened last.
  const soleKind: CartKind | null = panel ?? (selectedSpawn ? "ficha" : selectedZone ? "zone" : null);
  const slots = dual
    ? { left: leftKind, right: rightKind, sheet: null }
    : isDesktop
      ? { left: isLeft(soleKind) ? soleKind : null, right: isLeft(soleKind) ? null : soleKind, sheet: null }
      : { left: null, right: null, sheet: soleKind };

  const cameraTarget = useMemo((): CameraTarget | null => {
    if (!selectedZone) return null;
    if (selectedSpawn) return { center: selectedSpawn.position, zoom: selectedZone.zoom + POKEMON_ZOOM_BOOST };
    return { center: selectedZone.center, zoom: selectedZone.zoom };
  }, [selectedZone, selectedSpawn]);

  const cameraPadding: CameraPadding = isDesktop
    ? {
        top: selectedZone ? 30 : 40,
        bottom: selectedZone ? 30 : 40,
        left: slots.left ? LEFT_PAD : 40,
        right: slots.right ? RIGHT_PAD : 40,
      }
    : {
        top: 18,
        bottom: slots.sheet ? Math.round(screenHeight * SHEET_PEEK) + 18 : 28,
        left: 14,
        right: 14,
      };

  /* ── Actions ──────────────────────────────────────────────────────── */

  function selectZone(zoneId: string | null) {
    setSelectedZoneId(zoneId);
    setSelectedPokemonId(null);
    // Stepping zones keeps the rastreo in; anything else gives way.
    setPanel((current) => (current === "track" && zoneId ? "track" : null));
  }

  function stepZone(step: 1 | -1) {
    const count = orderedZones.length;
    const next = zoneIndex < 0 ? (step === 1 ? 0 : count - 1) : (zoneIndex + step + count) % count;
    const zone = orderedZones[next];
    if (zone) selectZone(zone.id);
  }

  function selectPokemon(pokemonId: number) {
    setSelectedPokemonId(pokemonId);
    // With two slots the rastreo stays beside the ficha it just opened.
    setPanel((current) => (current === "track" && dual ? "track" : null));
  }

  /** Points the rastreo at a Pokémon without leaving it. */
  function trackPokemon(zoneId: string, pokemonId: number | null) {
    setSelectedZoneId(zoneId);
    setSelectedPokemonId(pokemonId);
    setPanel("track");
  }

  function closePanel() {
    // One slot: the ficha never showed, so the tracked Pokémon goes too.
    if (panel === "track" && !dual) setSelectedPokemonId(null);
    setPanel(null);
  }

  function togglePanel(next: Panel) {
    if (panel === next) closePanel();
    else setPanel(next);
  }

  function weatherBlocked() {
    if (weather.status === "loading") return flash("Esperando el clima…"), true;
    if (weather.status === "error") return flash("Sin clima no hay potenciados"), true;
    return false;
  }

  function openTrack() {
    if (weatherBlocked()) return;
    if (!selectedZone) {
      const zone = orderedZones.find((z) => (boostedByZone[z.id]?.length ?? 0) > 0);
      if (!zone) return flash(filtering ? "Ningún potenciado con estos filtros" : "Ningún potenciado ahora");
      return trackPokemon(zone.id, boostedByZone[zone.id]?.[0]?.id ?? null);
    }
    const keep = zoneBoosted.some((s) => s.id === selectedPokemonId);
    trackPokemon(selectedZone.id, keep ? selectedPokemonId : (zoneBoosted[0]?.id ?? null));
  }

  function nextBoosted() {
    if (!tracking || !selectedZone) return openTrack();
    if (weatherBlocked()) return;
    const at = zoneBoosted.findIndex((s) => s.id === selectedPokemonId);
    const following = zoneBoosted[at + 1];
    if (following) return trackPokemon(selectedZone.id, following.id);
    // End of this zone's list: on to the next zone (southwards) with any.
    const count = orderedZones.length;
    for (let step = 1; step <= count; step += 1) {
      const zone = orderedZones[(zoneIndex + step) % count];
      const first = zone && boostedByZone[zone.id]?.[0];
      if (zone && first) {
        if (zone.id !== selectedZone.id) flash(`▼ ${zone.name}`);
        return trackPokemon(zone.id, first.id);
      }
    }
    flash(filtering ? "Ningún potenciado con estos filtros" : "Ningún potenciado ahora");
  }

  function toggleTrack() {
    if (tracking) closePanel();
    else openTrack();
  }

  function focusTeamMember(member: TeamMember) {
    setSelectedZoneId(member.zoneId);
    setPanel(null);
    // A weather visitor may have left since: then just fly to its zone.
    const here = radarSpawnsByZone[member.zoneId]?.some((s) => s.id === member.id);
    setSelectedPokemonId(here ? member.id : null);
    if (!here) flash(`${member.name} ya no está en la zona`);
  }

  function capture() {
    if (!selectedSpawn || !selectedZone || teamStatus !== "available") return;
    catchPokemon(selectedSpawn, selectedZone.id);
    // Played from the click/key handler, so browsers allow it.
    if (soundOn && selectedSpawn.cry) playCry(selectedSpawn.id, selectedSpawn.cry);
    const count = `${Math.min(team.length + 1, TEAM_SIZE)}/${TEAM_SIZE}`;
    // Muted captures say so, or a silent catch reads as broken sound.
    flash(`¡${selectedSpawn.name} capturado! · ${count}${soundOn ? "" : " · grito silenciado (M)"}`);
  }

  function releaseMember(id: number) {
    const member = team.find((m) => m.id === id);
    release(id);
    if (member) flash(`${member.name} liberado`);
  }

  function toggleSound() {
    setSoundOn((on) => !on);
    flash(soundOn ? "Grito al capturar: silenciado" : "Grito al capturar: activado");
  }

  function closeManual() {
    markManualSeen();
    setManualRequested(false);
  }

  const teamStatus: TeamStatus = team.some((m) => m.id === selectedPokemonId)
    ? "in-team"
    : isFull
      ? "full"
      : "available";

  // Esc steps back one level: manual → cartridge → Pokémon → zone → country.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (manualOpen) closeManual();
        else if (panel) closePanel();
        else if (selectedPokemonId !== null) setSelectedPokemonId(null);
        else if (selectedZoneId !== null) selectZone(null);
        else return;
        event.preventDefault();
        return;
      }
      if (manualOpen || event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
      const key = event.key.toLowerCase();
      if (key === "n") stepZone(-1);
      else if (key === "s") stepZone(1);
      else if (key === "p") nextBoosted();
      else if (key === "f") togglePanel("filters");
      else if (key === "e") togglePanel("team");
      else if (key === "m") toggleSound();
      else if (key === "?") setManualRequested(true);
      else return;
      event.preventDefault();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const readout = statusReadout({
    zones,
    zone: selectedZone,
    zoneSpawns: radarSpawns,
    spawn: selectedSpawn,
    weather: selectedZone ? (weatherByZone[selectedZone.id] ?? null) : null,
    weatherStatus: weather.status,
    panel,
    filters,
    filtering,
    totalMatches,
    zonesWithMatches,
    countryBoosted,
    zoneBoosted,
    team,
  });

  /* ── Cartridges ───────────────────────────────────────────────────── */

  function renderCart(kind: CartKind | null, placement: Placement) {
    switch (kind) {
      case "zone":
        return (
          selectedZone && (
            <ZoneCard
              key="zone"
              placement={placement}
              screenHeight={screenHeight}
              zone={selectedZone}
              index={zoneIndex}
              count={orderedZones.length}
              spawns={radarSpawns}
              matchingIds={matchingIds}
              weather={weather}
              selectedPokemonId={selectedPokemonId}
              onSelectPokemon={selectPokemon}
              onClose={() => selectZone(null)}
            />
          )
        );
      case "ficha":
        return (
          selectedSpawn &&
          selectedZone && (
            <PokemonDrawer
              key="ficha"
              placement={placement}
              screenHeight={screenHeight}
              spawn={selectedSpawn}
              zone={selectedZone}
              zoneSpawns={radarSpawns}
              teamStatus={teamStatus}
              teamCount={team.length}
              onCatch={capture}
              onRelease={() => releaseMember(selectedSpawn.id)}
              onOpenTeam={() => setPanel("team")}
              onSelectPokemon={selectPokemon}
              onClose={() => setSelectedPokemonId(null)}
              keysEnabled={!manualOpen}
            />
          )
        );
      case "track":
        return (
          <TrackPanel
            key="track"
            placement={placement}
            screenHeight={screenHeight}
            zone={selectedZone}
            weather={weather}
            boosted={zoneBoosted}
            countryCount={countryBoosted}
            filtering={filtering}
            currentId={selectedPokemonId}
            showFichaLink={!dual}
            onTrack={(id) => selectedZone && trackPokemon(selectedZone.id, id)}
            onNext={nextBoosted}
            onOpenFicha={() => setPanel(null)}
            onClose={closePanel}
          />
        );
      case "team":
        return (
          <TeamPanel
            key="team"
            placement={placement}
            screenHeight={screenHeight}
            team={team}
            zones={zones}
            onFocus={focusTeamMember}
            onRelease={releaseMember}
            onClose={closePanel}
          />
        );
      case "filters":
        return (
          <FilterPanel
            key="filters"
            placement={placement}
            screenHeight={screenHeight}
            filters={filters}
            onChange={setFilters}
            matchCount={totalMatches}
            zoneCount={zonesWithMatches}
            onClose={closePanel}
          />
        );
      default:
        return null;
    }
  }

  return (
    <main
      className={`pokedex ${dexDisplay.variable} ${dexLcd.variable} grid h-dvh w-full grid-cols-1 grid-rows-[60px_minmax(0,1fr)_60px_72px] overflow-hidden lg:grid-cols-[76px_minmax(0,1fr)] lg:grid-rows-[56px_minmax(0,1fr)_56px]`}
    >
      <Lid
        readout={readout}
        message={message}
        weatherStatus={weather.status}
        lensActive={crying || weather.status === "loading"}
        soundOn={soundOn}
        onToggleSound={toggleSound}
        filtersOpen={panel === "filters"}
        activeFilters={activeFilters}
        onToggleFilters={() => togglePanel("filters")}
        manualOpen={manualOpen}
        onOpenManual={() => setManualRequested(true)}
      />

      <Rail
        zoneIndex={zoneIndex}
        zoneCount={orderedZones.length}
        onStepZone={stepZone}
        boostCount={boostCount}
        trackOpen={tracking}
        onToggleTrack={toggleTrack}
        teamCount={team.length}
        teamOpen={panel === "team"}
        onToggleTeam={() => togglePanel("team")}
        manualOpen={manualOpen}
        onOpenManual={() => setManualRequested(true)}
      />

      {/* Bone bezel around the lit screen. */}
      <div className="bz-bezel relative mx-1.5 mt-1 mb-1 min-h-0 rounded-[16px] p-1 lg:col-start-2 lg:row-start-2 lg:mx-0 lg:mt-1.5 lg:mr-3 lg:mb-0 lg:rounded-[20px] lg:px-2 lg:pt-3.5 lg:pb-2">
        <span aria-hidden className="absolute top-1 left-1/2 hidden -translate-x-1/2 gap-2.5 lg:flex">
          <span className="size-1.5 rounded-full bg-red-600 shadow-[inset_0_-1px_1px_rgb(0_0_0/0.4)]" />
          <span className="size-1.5 rounded-full bg-red-600 shadow-[inset_0_-1px_1px_rgb(0_0_0/0.4)]" />
        </span>

        {/* The lit screen: map, glass, and the cartridges slotted over it. */}
        <div
          ref={screenRef}
          className="relative h-full overflow-hidden rounded-[12px] bg-[#06110c] shadow-[0_0_0_2px_#1a1d22] lg:rounded-[13px]"
        >
          <MapLoader
            zones={zones}
            spawns={radarSpawns}
            matchingIds={matchingIds}
            matchCountByZone={filtering && !selectedZone ? matchCountByZone : null}
            weatherByZone={weatherByZone}
            selectedZoneId={selectedZoneId}
            selectedPokemonId={selectedPokemonId}
            tracking={tracking}
            compact={!isDesktop}
            tagsHidden={!isDesktop && slots.sheet !== null}
            cameraTarget={cameraTarget}
            cameraPadding={cameraPadding}
            onSelectZone={(id) => selectZone(id)}
            onSelectPokemon={selectPokemon}
          />
          <div aria-hidden className="bz-glass absolute inset-0 z-[1] rounded-[inherit]" />
          {!reduce && (
            // CRT power-on: the black collapses to the horizon line.
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-50 bg-black"
              initial={{ scaleY: 1 }}
              animate={{ scaleY: 0 }}
              transition={{ delay: 0.1, duration: 0.28, ease: "easeOut" }}
            />
          )}

          <AnimatePresence initial={false}>{renderCart(slots.left, "left")}</AnimatePresence>
          <AnimatePresence initial={false}>{renderCart(slots.right, "right")}</AnimatePresence>
          <AnimatePresence initial={false}>{renderCart(slots.sheet, "sheet")}</AnimatePresence>
        </div>
      </div>

      <Bay team={team} currentId={selectedPokemonId} onSelectMember={focusTeamMember} crying={crying} />
      <Dock
        team={team}
        currentId={selectedPokemonId}
        onSelectMember={focusTeamMember}
        boostCount={boostCount}
        trackOpen={tracking}
        onToggleTrack={toggleTrack}
        teamOpen={panel === "team"}
        onToggleTeam={() => togglePanel("team")}
        onStepZone={stepZone}
      />
      <Chin crying={crying} />

      <AnimatePresence>
        {manualOpen && <Manual key="manual" firstRun={!manualSeen} onClose={closeManual} />}
      </AnimatePresence>
    </main>
  );
}

function isLeft(kind: CartKind | null) {
  return kind === "zone" || kind === "track" || kind === "team";
}

/** One flashing line on the lid's LCD, cleared after a moment. */
function useTicker() {
  const [message, setMessage] = useState<{ id: number; text: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const nextId = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const flash = useCallback((text: string) => {
    clearTimeout(timer.current);
    nextId.current += 1;
    setMessage({ id: nextId.current, text });
    timer.current = setTimeout(() => setMessage(null), MESSAGE_MS);
  }, []);
  return { message, flash };
}

/** Height of an element, kept current on resize (never per frame). */
function useHeight<T extends HTMLElement>() {
  const [height, setHeight] = useState(0);
  const ref = useCallback((element: T | null) => {
    if (!element) return;
    setHeight(element.clientHeight);
    const observer = new ResizeObserver(() => setHeight(element.clientHeight));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, height] as const;
}

type ReadoutInput = {
  zones: readonly Zone[];
  zone: Zone | null;
  zoneSpawns: readonly RadarSpawn[];
  spawn: RadarSpawn | null;
  weather: ZoneWeather | null;
  weatherStatus: "loading" | "error" | "ready";
  panel: Panel | null;
  filters: RadarFilters;
  filtering: boolean;
  totalMatches: number;
  zonesWithMatches: number;
  countryBoosted: number;
  zoneBoosted: readonly RadarSpawn[];
  team: readonly TeamMember[];
};

/** What the lid's LCD says when nothing is flashing: where, then what. */
function statusReadout(input: ReadoutInput): Readout {
  const { zone, spawn, panel } = input;
  const where = ["Argentina", ...(zone ? [zone.name] : [])];
  const result = `${input.totalMatches} Pokémon en ${input.zonesWithMatches} ${input.zonesWithMatches === 1 ? "zona" : "zonas"}`;

  if (panel === "filters") return { trail: ["Argentina", "Filtros"], line: result };
  if (panel === "team") {
    const shared = teamThreats(input.team).filter(isSharedWeakness);
    const line =
      input.team.length === 0
        ? "Equipo vacío"
        : `${input.team.length}/${TEAM_SIZE} · ${
            shared.length ? `débil a ${shared.map((t) => TYPE_META[t.type].label).join(", ")}` : "equilibrado"
          }`;
    return { trail: ["Argentina", "Equipo"], line };
  }
  if (panel === "track") {
    const at = input.zoneBoosted.findIndex((s) => s.id === spawn?.id);
    const line =
      spawn && at >= 0
        ? `${pad2(at + 1)}/${pad2(input.zoneBoosted.length)} · ${spawn.name}${spawn.isVisitor ? " · visitante" : ""}`
        : `${input.zoneBoosted.length} potenciados acá`;
    return { trail: [...where, "Rastreo"], line };
  }
  if (spawn) {
    const tag = spawn.isVisitor ? " · visitante" : spawn.boostedBy ? " · potenciado" : "";
    return { trail: [...where, `N.º ${String(spawn.id).padStart(3, "0")}`], line: `${spawn.name}${tag}` };
  }
  if (zone) {
    const detected = input.zoneSpawns.length > 0 ? `${input.zoneSpawns.length} detectados` : "sin señal";
    const sky = input.weather ? `${WEATHER_META[input.weather.kind].label} ${input.weather.temperatureC}° · ` : "";
    return { trail: where, line: `${sky}${detected}` };
  }
  if (input.filtering) {
    const types = input.filters.types.map((t) => TYPE_META[t].label).join(" + ");
    return { trail: ["Argentina", types ? `Filtro ${types}` : "Filtros activos"], line: result };
  }
  if (input.weatherStatus === "loading") return { trail: where, line: "Sintonizando el clima…" };
  if (input.weatherStatus === "error") return { trail: where, line: `${input.zones.length} zonas · clima no disponible` };
  return { trail: where, line: `${input.zones.length} zonas · ${input.countryBoosted} potenciados` };
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/** Stable empty values, so memoized consumers don't recompute needlessly. */
const NO_WEATHER: Readonly<Record<string, never>> = {};
const NO_SPAWNS: RadarSpawn[] = [];
