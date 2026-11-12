import type { Habitat } from "@/lib/habitats";

export type LngLat = [lng: number, lat: number];

export type Zone = {
  id: string;
  name: string;
  province: string;
  habitat: Habitat;
  center: LngLat;
  /** Camera zoom used when flying into the zone. */
  zoom: number;
  description: string;
};

/**
 * Real Argentine landmarks, each one standing in for a PokéAPI habitat.
 * This is the narrative backbone of the radar: where a Pokémon shows up
 * depends on which habitat the zone represents.
 */
export const ZONES: readonly Zone[] = [
  {
    id: "buenos-aires",
    name: "Buenos Aires",
    province: "CABA",
    habitat: "urban",
    center: [-58.3816, -34.6037],
    zoom: 11.5,
    description: "Asfalto, luces y colectivos: el hábitat urbano por excelencia.",
  },
  {
    id: "pampa",
    name: "Llanura Pampeana",
    province: "La Pampa",
    habitat: "grassland",
    center: [-64.2906, -36.6203],
    zoom: 8,
    description: "Pastizales infinitos donde corren las especies de pradera.",
  },
  {
    id: "iguazu",
    name: "Cataratas del Iguazú",
    province: "Misiones",
    habitat: "waters-edge",
    center: [-54.4367, -25.6953],
    zoom: 12,
    description: "275 saltos de agua y selva húmeda: territorio de orilla.",
  },
  {
    id: "aconcagua",
    name: "Aconcagua",
    province: "Mendoza",
    habitat: "mountain",
    center: [-70.0109, -32.6532],
    zoom: 10.5,
    description: "El techo de América. Solo los más resistentes viven aquí.",
  },
  {
    id: "humahuaca",
    name: "Quebrada de Humahuaca",
    province: "Jujuy",
    habitat: "rough-terrain",
    center: [-65.3494, -23.2054],
    zoom: 10.5,
    description: "Cerros de siete colores y senderos de piedra suelta.",
  },
  {
    id: "ischigualasto",
    name: "Valle de la Luna",
    province: "San Juan",
    habitat: "rare",
    center: [-67.8402, -30.1636],
    zoom: 10.5,
    description: "Fósiles de 230 millones de años. Avistajes muy poco comunes.",
  },
  {
    id: "nahuel-huapi",
    name: "Bosque Andino Patagónico",
    province: "Río Negro",
    habitat: "forest",
    center: [-71.5, -41.0],
    zoom: 9.5,
    description: "Arrayanes, coihues y lagos: el bosque más denso del sur.",
  },
  {
    id: "valdes",
    name: "Península Valdés",
    province: "Chubut",
    habitat: "sea",
    center: [-64.0, -42.5],
    zoom: 8.5,
    description: "Ballenas, lobos marinos y aguas abiertas del Atlántico.",
  },
  {
    id: "cueva-de-las-manos",
    name: "Cueva de las Manos",
    province: "Santa Cruz",
    habitat: "cave",
    center: [-70.6597, -47.1503],
    zoom: 11,
    description: "Arte rupestre de 9.000 años en un cañadón oscuro.",
  },
];

/** Initial camera: the whole country in view. */
export const ARGENTINA_BOUNDS: [LngLat, LngLat] = [
  [-73.6, -55.1],
  [-53.6, -21.8],
];
