export const POKEMON_TYPES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
] as const;

export type PokemonType = (typeof POKEMON_TYPES)[number];

export function isPokemonType(value: string): value is PokemonType {
  return (POKEMON_TYPES as readonly string[]).includes(value);
}

export const TYPE_META: Record<PokemonType, { label: string; color: string }> = {
  normal: { label: "Normal", color: "#a8a77a" },
  fire: { label: "Fuego", color: "#ee8130" },
  water: { label: "Agua", color: "#6390f0" },
  electric: { label: "Eléctrico", color: "#f7d02c" },
  grass: { label: "Planta", color: "#7ac74c" },
  ice: { label: "Hielo", color: "#96d9d6" },
  fighting: { label: "Lucha", color: "#c22e28" },
  poison: { label: "Veneno", color: "#a33ea1" },
  ground: { label: "Tierra", color: "#e2bf65" },
  flying: { label: "Volador", color: "#a98ff3" },
  psychic: { label: "Psíquico", color: "#f95587" },
  bug: { label: "Bicho", color: "#a6b91a" },
  rock: { label: "Roca", color: "#b6a136" },
  ghost: { label: "Fantasma", color: "#735797" },
  dragon: { label: "Dragón", color: "#6f35fc" },
  dark: { label: "Siniestro", color: "#705746" },
  steel: { label: "Acero", color: "#b7b7ce" },
  fairy: { label: "Hada", color: "#d685ad" },
};

/** Habitat data in PokéAPI only covers generations I–III (#1–#386). */
export function generationOf(id: number): 1 | 2 | 3 {
  if (id <= 151) return 1;
  if (id <= 251) return 2;
  return 3;
}
