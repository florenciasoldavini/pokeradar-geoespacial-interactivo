"use client";

import { createContext, use } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";

export const MapContext = createContext<MapLibreMap | null>(null);

/** Returns the loaded map instance. Only valid inside <MapView>. */
export function useMap(): MapLibreMap {
  const map = use(MapContext);
  if (!map) throw new Error("useMap must be used inside <MapView>");
  return map;
}
