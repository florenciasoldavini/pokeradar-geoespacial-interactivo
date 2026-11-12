/** The 9 habitats exposed by PokéAPI's /pokemon-habitat endpoint. */
export const HABITATS = [
  "cave",
  "forest",
  "grassland",
  "mountain",
  "rare",
  "rough-terrain",
  "sea",
  "urban",
  "waters-edge",
] as const;

export type Habitat = (typeof HABITATS)[number];

type HabitatMeta = {
  label: string;
  /** Accent used for the zone marker and its radar ring. */
  color: string;
};

export const HABITAT_META: Record<Habitat, HabitatMeta> = {
  cave: { label: "Caverna", color: "#a78bfa" },
  forest: { label: "Bosque", color: "#4ade80" },
  grassland: { label: "Pradera", color: "#bef264" },
  mountain: { label: "Montaña", color: "#cbd5e1" },
  rare: { label: "Raro", color: "#f472b6" },
  "rough-terrain": { label: "Terreno escarpado", color: "#fb923c" },
  sea: { label: "Mar", color: "#38bdf8" },
  urban: { label: "Urbano", color: "#facc15" },
  "waters-edge": { label: "Orilla", color: "#2dd4bf" },
};
