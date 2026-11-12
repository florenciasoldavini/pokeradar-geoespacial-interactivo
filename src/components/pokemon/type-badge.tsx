import { TYPE_META, type PokemonType } from "@/lib/pokemon-types";

export function TypeBadge({ type }: { type: PokemonType }) {
  const { label, color } = TYPE_META[type];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={{
        color,
        borderColor: `${color}55`,
        backgroundColor: `${color}1a`,
      }}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {label}
    </span>
  );
}
