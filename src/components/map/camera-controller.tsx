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
 * Fork of the production controller: the same interruptible flyTo (and the
 * same reduced-motion jump: `essential` stays false), but the padding comes
 * from whichever cartridges are in, so the radar lands in the free part of
 * the screen: between the zone and the ficha on desktop, above the sheet on
 * phones.
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
      map.fitBounds(ARGENTINA_BOUNDS, { padding: pad, pitch: 0, bearing: 0, duration: 1600 });
      return;
    }
    map.flyTo({ center: [lng, lat], zoom, padding: pad, pitch: 48, bearing: -10, speed: 0.9, curve: 1.5 });
  }, [map, lng, lat, zoom, top, right, bottom, left]);

  return null;
}
