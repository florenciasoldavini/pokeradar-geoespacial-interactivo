import type { Map as MapLibreMap } from "maplibre-gl";

const LAND = "#151e29";
const WATER = "#070b10"; // same as --color-radar-bg, so the sea blends into the UI

/**
 * Re-tints the OpenFreeMap dark style for the radar UI. Out of the box its
 * water (rgb 27,27,29) is barely distinguishable from — and lighter than —
 * land (rgb 12,12,12), so coastlines like the Río de la Plata disappear.
 */
export function applyRadarTheme(map: MapLibreMap) {
  for (const layer of map.getStyle().layers) {
    if (layer.type === "background") {
      map.setPaintProperty(layer.id, "background-color", LAND);
    } else if (layer.id === "water") {
      map.setPaintProperty(layer.id, "fill-color", WATER);
    } else if (layer.id === "waterway") {
      map.setPaintProperty(layer.id, "line-color", WATER);
    } else if (layer.type === "symbol") {
      // Basemap place names stay readable but yield to the zone labels.
      map.setPaintProperty(layer.id, "text-opacity", 0.45);
    }
  }
}
