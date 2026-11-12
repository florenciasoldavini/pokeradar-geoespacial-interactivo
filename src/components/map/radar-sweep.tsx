"use client";

import { useEffect } from "react";
import type { CanvasSource, Coordinates, Map as MapLibreMap } from "maplibre-gl";
import { useMap } from "@/components/map/map-context";
import type { Spawn } from "@/lib/spawn";
import type { Zone } from "@/lib/zones";

const SOURCE_ID = "radar-sweep";
const LAYER_ID = "radar-sweep";
/** Canvas resolution. Re-uploaded every frame, so kept modest. */
const CANVAS_PX = 640;
/** Breathing room between the outermost Pokémon and the radar's edge. */
const EDGE_PADDING_PX = 48;
const RADAR_RGB = "92 242 165"; // --color-radar
const SWEEP_SECONDS = 4;
const SWEEP_TRAIL_RAD = (70 * Math.PI) / 180;
const INTRO_MS = 1200;

type RadarSweepProps = {
  zone: Zone;
  spawns: readonly Spawn[];
};

/**
 * Radar scope painted *into* the map: a canvas source draped over the
 * terrain by MapLibre's renderer. Unlike a DOM marker it gets true
 * perspective, so it covers the same ground as the Pokémon at any zoom,
 * pan position, pitch or bearing.
 */
export function RadarSweep({ zone, spawns }: RadarSweepProps) {
  const map = useMap();
  const radiusPx = outermostSpawnPx(zone, spawns) + EDGE_PADDING_PX;

  // Create the source + layer once per zone and run the sweep animation.
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_PX;
    canvas.height = CANVAS_PX;
    const context = canvas.getContext("2d");
    if (!context) return;

    map.addSource(SOURCE_ID, {
      type: "canvas",
      canvas,
      animate: true,
      // Placeholder size; the effect below fits it to the spawns right away.
      coordinates: groundSquare(zone, EDGE_PADDING_PX),
    });
    // Under the basemap labels, so place names stay readable on top.
    map.addLayer(
      {
        id: LAYER_ID,
        type: "raster",
        source: SOURCE_ID,
        paint: { "raster-fade-duration": 0 },
      },
      firstSymbolLayerId(map),
    );

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let frame = 0;
    function tick(now: number) {
      const elapsed = now - start;
      const intro = reduceMotion ? 1 : Math.min(elapsed / INTRO_MS, 1);
      const angle = reduceMotion
        ? -Math.PI / 2
        : ((elapsed / 1000) * 2 * Math.PI) / SWEEP_SECONDS;
      if (context) drawRadar(context, angle, intro);
      if (!reduceMotion || intro < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    };
  }, [map, zone]);

  // The weather visitor can land after mount and push the outer edge out.
  useEffect(() => {
    map.getSource<CanvasSource>(SOURCE_ID)?.setCoordinates(groundSquare(zone, radiusPx));
  }, [map, zone, radiusPx]);

  return null;
}

function drawRadar(ctx: CanvasRenderingContext2D, angle: number, intro: number) {
  const center = CANVAS_PX / 2;
  const eased = 1 - (1 - intro) ** 3;
  const radius = (center - 2) * (0.4 + 0.6 * eased);
  const color = (alpha: number) => `rgb(${RADAR_RGB} / ${alpha * eased})`;

  ctx.clearRect(0, 0, CANVAS_PX, CANVAS_PX);

  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fillStyle = color(0.05);
  ctx.fill();

  ctx.lineWidth = 2;
  for (const [ring, alpha] of [[1, 0.4], [0.64, 0.2], [0.28, 0.14]] as const) {
    ctx.beginPath();
    ctx.arc(center, center, radius * ring, 0, Math.PI * 2);
    ctx.strokeStyle = color(alpha);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(center - radius, center);
  ctx.lineTo(center + radius, center);
  ctx.moveTo(center, center - radius);
  ctx.lineTo(center, center + radius);
  ctx.strokeStyle = color(0.12);
  ctx.stroke();

  // Sweep: a wedge that fades out behind the leading edge.
  const sweep = ctx.createConicGradient(angle - SWEEP_TRAIL_RAD, center, center);
  const trail = SWEEP_TRAIL_RAD / (Math.PI * 2);
  sweep.addColorStop(0, color(0));
  sweep.addColorStop(trail, color(0.38));
  sweep.addColorStop(Math.min(trail + 0.001, 1), color(0));
  sweep.addColorStop(1, color(0));
  ctx.beginPath();
  ctx.moveTo(center, center);
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fillStyle = sweep;
  ctx.fill();
}

/** Degrees of longitude per screen px at the zone's zoom (512px tiles). */
function degreesPerPx(zone: Zone) {
  return 360 / (512 * 2 ** zone.zoom);
}

/**
 * Corners (TL, TR, BR, BL) of a square on the ground centered on the zone,
 * `radiusPx` zone-zoom pixels from center to edge. Latitude is scaled by
 * cos(lat), mirroring spawn-layout.ts, so the radar is as round as the ring.
 */
function groundSquare(zone: Zone, radiusPx: number): Coordinates {
  const [lng, lat] = zone.center;
  const dLng = radiusPx * degreesPerPx(zone);
  const dLat = dLng * Math.cos((lat * Math.PI) / 180);
  return [
    [lng - dLng, lat + dLat],
    [lng + dLng, lat + dLat],
    [lng + dLng, lat - dLat],
    [lng - dLng, lat - dLat],
  ];
}

/**
 * Distance, in px at the zone's zoom, from the zone center to its furthest
 * spawn (weather visitor included). Inverse of spawn-layout.ts.
 */
function outermostSpawnPx(zone: Zone, spawns: readonly Spawn[]): number {
  const [lng, lat] = zone.center;
  const latScale = Math.cos((lat * Math.PI) / 180);
  return spawns.reduce((max, spawn) => {
    const dx = (spawn.position[0] - lng) / degreesPerPx(zone);
    const dy = (spawn.position[1] - lat) / latScale / degreesPerPx(zone);
    return Math.max(max, Math.hypot(dx, dy));
  }, 0);
}

function firstSymbolLayerId(map: MapLibreMap): string | undefined {
  return map.getStyle().layers.find((layer) => layer.type === "symbol")?.id;
}
