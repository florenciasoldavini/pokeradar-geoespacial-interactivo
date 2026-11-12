/**
 * The subset of PokéAPI v2 response shapes this app reads. Kept deliberately
 * narrow: anything not listed here is never accessed.
 */

type NamedResource = { name: string; url: string };

type Localized = { language: NamedResource };

export type ApiHabitat = {
  id: number;
  name: string;
  pokemon_species: NamedResource[];
};

export type ApiPokemon = {
  id: number;
  name: string;
  /** Decimetres. */
  height: number;
  /** Hectograms. */
  weight: number;
  types: { slot: number; type: NamedResource }[];
  stats: { base_stat: number; stat: NamedResource }[];
  abilities: { is_hidden: boolean; slot: number; ability: NamedResource }[];
  cries: { latest: string | null; legacy: string | null };
  sprites: {
    front_default: string | null;
    other: {
      showdown: { front_default: string | null };
      "official-artwork": { front_default: string | null };
    };
  };
};

export type ApiPokemonSpecies = {
  id: number;
  name: string;
  is_legendary: boolean;
  is_mythical: boolean;
  capture_rate: number;
  names: (Localized & { name: string })[];
  genera: (Localized & { genus: string })[];
  flavor_text_entries: (Localized & { flavor_text: string })[];
};

export type ApiType = {
  id: number;
  name: string;
  pokemon: { slot: number; pokemon: NamedResource }[];
};
