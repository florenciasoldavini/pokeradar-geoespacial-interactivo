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

/** PokéAPI's type ids, which don't follow the order above. */
const TYPE_ID: Record<PokemonType, number> = {
  normal: 1,
  fighting: 2,
  flying: 3,
  poison: 4,
  ground: 5,
  rock: 6,
  bug: 7,
  ghost: 8,
  steel: 9,
  fire: 10,
  water: 11,
  grass: 12,
  electric: 13,
  psychic: 14,
  ice: 15,
  dragon: 16,
  dark: 17,
  fairy: 18,
};

/** The type's round symbol (Sword & Shield style) from PokéAPI's sprite repo. */
export function typeIconUrl(type: PokemonType): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/small/${TYPE_ID[type]}.png`;
}

/** Habitat data in PokéAPI only covers generations I–III (#1–#386). */
export function generationOf(id: number): 1 | 2 | 3 {
  if (id <= 151) return 1;
  if (id <= 251) return 2;
  return 3;
}
