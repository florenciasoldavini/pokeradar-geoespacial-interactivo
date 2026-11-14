"use client";

import { useState, type ComponentProps } from "react";
import Image from "next/image";

type SpriteProps = Omit<ComponentProps<typeof Image>, "src" | "unoptimized" | "onError"> & {
  src: string;
};

/**
 * A Pokémon image from GitHub's raw CDN (animated GIFs, served as is). If it
 * fails to load, a "?" takes its box instead of the browser's broken icon.
 */
export function Sprite({ src, alt, className = "", ...props }: SpriteProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (failedSrc === src) {
    return (
      <span
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={`${className} dex-font-lcd grid place-items-center text-radar/60`}
      >
        ?
      </span>
    );
  }
  return <Image src={src} alt={alt} unoptimized onError={() => setFailedSrc(src)} className={className} {...props} />;
}
