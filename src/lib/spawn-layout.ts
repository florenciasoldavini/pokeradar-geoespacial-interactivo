import type { LngLat, Zone } from "@/lib/zones";

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/** Spawn ring radius on screen, in px, at the zone's own camera zoom. */
export const SPAWN_RADIUS_PX = 170;

/**
 * Sunflower (golden-angle) layout: evenly spread points with no overlaps,
 * jittered slightly so it doesn't look machine-made. Shared by the server
 * (habitat spawns) and the client (weather visitors).
 */
export function spawnPosition(
  zone: Zone,
  index: number,
  total: number,
  random: () => number,
): LngLat {
  // Degrees of longitude per screen pixel at this zoom (512px world tiles).
  const degreesPerPx = 360 / (512 * 2 ** zone.zoom);
  const radius =
    SPAWN_RADIUS_PX *
    degreesPerPx *
    Math.sqrt((index + 0.6) / total) *
    (0.85 + random() * 0.3);
  const angle = index * GOLDEN_ANGLE + random() * 0.5;
  const [lng, lat] = zone.center;
  // In Web Mercator a degree of latitude is taller than one of longitude by
  // 1/cos(lat); scale it back so the ring is round on screen.
  return [
    lng + radius * Math.cos(angle),
    lat + radius * Math.sin(angle) * Math.cos((lat * Math.PI) / 180),
  ];
}
