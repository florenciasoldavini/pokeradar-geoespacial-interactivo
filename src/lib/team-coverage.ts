import { defensiveMatchups } from "@/lib/type-chart";
import type { TeamMember } from "@/hooks/use-team";
import { POKEMON_TYPES, type PokemonType } from "@/lib/pokemon-types";

export type TypeThreat = {
  /** Attacking type. */
  type: PokemonType;
  /** Members that take ×2 or more from it. */
  weak: number;
  /** Members that take ×½ or less (immunities included). */
  resist: number;
};

/** How each attacking type fares against the whole team. */
export function teamThreats(team: readonly TeamMember[]): TypeThreat[] {
  const multipliers = team.map((member) => {
    const byType = new Map<PokemonType, number>();
    for (const group of defensiveMatchups(member.types)) {
      for (const type of group.types) byType.set(type, group.multiplier);
    }
    return byType;
  });
  return POKEMON_TYPES.map((type) => ({
    type,
    weak: multipliers.filter((byType) => (byType.get(type) ?? 1) > 1).length,
    resist: multipliers.filter((byType) => (byType.get(type) ?? 1) < 1).length,
  }));
}

/** A type that hits two or more members hard and nobody walls it. */
export function isSharedWeakness(threat: TypeThreat): boolean {
  return threat.weak >= 2 && threat.resist === 0;
}
