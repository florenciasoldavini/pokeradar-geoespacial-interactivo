import { Sprite } from "@/components/pokemon/sprite";
import { TYPE_META, typeIconUrl, type PokemonType } from "@/lib/pokemon-types";

/**
 * A type's round symbol on its own, for compact spots. The name shows in a
 * tooltip on hover (screen readers get it from the alt text).
 */
export function TypeIcon({ type, size }: { type: PokemonType; size: number }) {
  const { label } = TYPE_META[type];
  return (
    <span className="group/type relative inline-flex shrink-0">
      <Sprite
        src={typeIconUrl(type)}
        alt={label}
        width={size}
        height={size}
        className="rounded-full"
        style={{ width: size, height: size }}
      />
      <span
        aria-hidden
        className="dex-font-lcd pointer-events-none absolute top-full left-1/2 z-10 mt-1 -translate-x-1/2 rounded-md bg-black/90 px-1.5 py-0.5 text-[11px] whitespace-nowrap text-white opacity-0 shadow-[0_2px_6px_rgb(0_0_0/0.5)] transition-opacity duration-100 group-hover/type:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
