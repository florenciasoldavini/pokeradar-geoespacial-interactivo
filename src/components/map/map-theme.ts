import type { ExpressionSpecification, Map as MapLibreMap } from "maplibre-gl";

/* Phosphor palette: the basemap reads as a lit green LCD, not a web map. */
const LAND = "#0c1713";
const WATER = "#030806";
const VEGETATION = "#0f1f19";
const BOUNDARY = "#2e6b52";
const LABEL = "#8fd9b4";
/** Spanish place names first ("Islas Malvinas", not "Falkland Islands"). */
const SPANISH_NAME: ExpressionSpecification = ["coalesce", ["get", "name:es"], ["get", "name:latin"], ["get", "name"]];

/**
 * Re-tints the OpenFreeMap dark style for the Pokédex screen: water stays
 * darker than land (so the Río de la Plata is legible), with a green cast,
 * brighter borders and place names in Spanish.
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
      // Only labels that show a place name; road refs and the like stay as is.
      if (JSON.stringify(map.getLayoutProperty(layer.id, "text-field") ?? "").includes("name")) {
        map.setLayoutProperty(layer.id, "text-field", SPANISH_NAME);
      }
    }
  }
}
