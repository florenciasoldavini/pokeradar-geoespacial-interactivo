"use client";

import { useEffect } from "react";
import type { PaddingOptions } from "maplibre-gl";
import { useMap } from "@/components/map/map-context";
import { DESKTOP_QUERY, useMediaQuery } from "@/hooks/use-media-query";
import { ARGENTINA_BOUNDS, type LngLat } from "@/lib/zones";

export type CameraTarget = { center: LngLat; zoom: number };

type CameraControllerProps = {
  target: CameraTarget | null;
  /** Reserve screen space for the detail drawer so the target isn't hidden. */
  drawerOpen: boolean;
};

/**
 * Drives the camera from React state. MapLibre animations are interruptible,
 * so selecting something else mid-flight simply re-targets the camera.
 * `essential` is left false on purpose: users with prefers-reduced-motion get
 * an instant jump instead of a flight.
 */
export function CameraController({ target, drawerOpen }: CameraControllerProps) {
  const map = useMap();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  // Depend on primitives, not the object: a new-but-equal target from a
  // parent re-render must not restart the flight.
  const lng = target?.center[0];
  const lat = target?.center[1];
  const zoom = target?.zoom;

  useEffect(() => {
    const padding = drawerPadding(drawerOpen, isDesktop, map.getContainer());

    if (lng === undefined || lat === undefined || zoom === undefined) {
      map.fitBounds(ARGENTINA_BOUNDS, {
        padding: 48,
        pitch: 0,
        bearing: 0,
        duration: 1800,
      });
      return;
    }
    map.flyTo({
      center: [lng, lat],
      zoom,
      padding,
      pitch: 55,
      bearing: -12,
      speed: 0.9,
      curve: 1.5,
    });
  }, [map, lng, lat, zoom, drawerOpen, isDesktop]);

  return null;
}

function drawerPadding(
  open: boolean,
  isDesktop: boolean,
  container: HTMLElement,
): PaddingOptions {
  const none = { top: 0, right: 0, bottom: 0, left: 0 };
  if (!open) return none;
  // Desktop: 400px panel + 16px gap on the right. Mobile: bottom sheet.
  return isDesktop
    ? { ...none, right: 416 }
    : { ...none, bottom: Math.round(container.clientHeight * 0.55) };
}
