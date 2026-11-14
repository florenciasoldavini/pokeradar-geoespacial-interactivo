import { Sprite } from "@/components/pokemon/sprite";
import { TYPE_META, typeIconUrl, type PokemonType } from "@/lib/pokemon-types";

export function TypeBadge({ type }: { type: PokemonType }) {
  const { label, color } = TYPE_META[type];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border py-0.5 pr-2.5 pl-1 text-xs font-medium"
      style={{
        color,
        borderColor: `${color}55`,
        backgroundColor: `${color}1a`,
      }}
    >
      <Sprite src={typeIconUrl(type)} alt="" width={16} height={16} className="size-4 shrink-0 rounded-full" />
      {label}
    </span>
  );
}
