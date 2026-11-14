"use client";

import { useEffect } from "react";
import { useMap } from "@/components/map/map-context";
import { ARGENTINA_BOUNDS, type LngLat } from "@/lib/zones";

export type CameraTarget = { center: LngLat; zoom: number };

/** Screen px the open cartridges cover, per edge of the lit screen. */
export type CameraPadding = { top: number; right: number; bottom: number; left: number };

type CameraControllerProps = {
  target: CameraTarget | null;
  padding: CameraPadding;
};

/**
 * Translates React state into an interruptible flyTo / fitBounds (with
 * reduced motion MapLibre jumps instead: `essential` stays false). The
 * padding comes from whichever panels are open, so the radar lands in the
 * free part of the screen: between the side panels on desktop, above the
 * sheet on phones.
 */
export function CameraController({ target, padding }: CameraControllerProps) {
  const map = useMap();
  // Primitives, not objects: an equal target must not restart the flight.
  const lng = target?.center[0];
  const lat = target?.center[1];
  const zoom = target?.zoom;
  const { top, right, bottom, left } = padding;

  useEffect(() => {
    const pad = { top, right, bottom, left };
    if (lng === undefined || lat === undefined || zoom === undefined) {
      // flyTo stores its padding on the map; absolutePadding replaces it
      // instead of adding to it, so the country view frames like at first load.
      map.fitBounds(ARGENTINA_BOUNDS, { padding: pad, absolutePadding: true, pitch: 0, bearing: 0, duration: 1600 });
      return;
    }
    map.flyTo({ center: [lng, lat], zoom, padding: pad, pitch: 48, bearing: -10, speed: 0.9, curve: 1.5 });
  }, [map, lng, lat, zoom, top, right, bottom, left]);

  return null;
}
