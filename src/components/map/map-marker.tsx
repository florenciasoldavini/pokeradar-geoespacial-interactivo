"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Marker } from "maplibre-gl";
import { useMap } from "@/components/map/map-context";
import type { LngLat } from "@/lib/zones";

type MapMarkerProps = {
  lngLat: LngLat;
  children: ReactNode;
};

/**
 * Bridges MapLibre's imperative Marker API with React: MapLibre positions a
 * plain <div>, and React renders (and animates) whatever goes inside it.
 */
export function MapMarker({ lngLat, children }: MapMarkerProps) {
  const map = useMap();
  const [element] = useState(() => document.createElement("div"));
  const [lng, lat] = lngLat;

  useEffect(() => {
    const marker = new Marker({ element }).setLngLat([lng, lat]).addTo(map);
    return () => {
      marker.remove();
    };
  }, [map, element, lng, lat]);

  return createPortal(children, element);
}
