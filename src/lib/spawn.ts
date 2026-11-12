import type { PokemonType } from "@/lib/pokemon-types";
import type { WeatherKind } from "@/lib/weather";
import type { LngLat } from "@/lib/zones";

/** The minimum needed to draw a Pokémon on the map. */
export type PokemonSummary = {
  id: number;
  /** Display-ready species name, e.g. "Mr Mime". */
  name: string;
  types: PokemonType[];
  /** Animated Showdown GIF, falling back to the static sprite. */
  sprite: string;
  /** Cry audio (.ogg), if PokéAPI has one. */
  cry: string | null;
  /** Sum of the six base stats; drives the stat-range filter. */
  statTotal: number;
};

/** A Pokémon placed on the map. Built on the server, rendered on the client. */
export type Spawn = PokemonSummary & { position: LngLat };

/** zone id → Pokémon detected there. An empty list means "no signal". */
export type ZoneSpawns = Record<string, Spawn[]>;

/** A spawn as the radar shows it right now, after applying live weather. */
export type RadarSpawn = Spawn & {
  /** Weather currently boosting this Pokémon's type, if any. */
  boostedBy: WeatherKind | null;
  /** Only here because of the current weather. */
  isVisitor: boolean;
};

/** weather → Pokémon that may show up anywhere while it lasts. */
export type WeatherVisitors = Record<WeatherKind, PokemonSummary[]>;
