import type { Map as MapLibreMap } from "maplibre-gl";

/* Phosphor palette: the basemap reads as a lit green LCD, not a web map. */
const LAND = "#0c1713";
const WATER = "#030806";
const VEGETATION = "#0f1f19";
const BOUNDARY = "#2e6b52";
const LABEL = "#8fd9b4";

/**
 * Re-tints the OpenFreeMap dark style for the Pokédex screen. Like the
 * production theme it keeps water darker than land (the Río de la Plata
 * stays legible) and only adds a green cast plus brighter borders.
 */
export function applyRadarTheme(map: MapLibreMap) {
  for (const layer of map.getStyle().layers) {
    if (layer.type === "background") {
      map.setPaintProperty(layer.id, "background-color", LAND);
    } else if (layer.id === "water") {
      map.setPaintProperty(layer.id, "fill-color", WATER);
    } else if (layer.id === "waterway") {
      map.setPaintProperty(layer.id, "line-color", WATER);
    } else if (layer.id === "landcover_wood" || layer.id === "landuse_park") {
      map.setPaintProperty(layer.id, "fill-color", VEGETATION);
    } else if (layer.id.startsWith("boundary_")) {
      map.setPaintProperty(layer.id, "line-color", BOUNDARY);
    } else if (layer.type === "symbol") {
      // Basemap names stay readable but yield to the zone tags.
      map.setPaintProperty(layer.id, "text-color", LABEL);
      map.setPaintProperty(layer.id, "text-opacity", 0.42);
    }
  }
}
