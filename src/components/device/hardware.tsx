"use client";

import { motion, useReducedMotion } from "framer-motion";

/*
 * The Pokédex's physical parts. Presses are a 1.5px translate plus a shadow
 * swap (no transition on the shadow), so only transform ever animates.
 */

export const KEY_BASE =
  "cursor-pointer select-none transition-transform duration-75 ease-out active:translate-y-[1.5px] disabled:cursor-not-allowed disabled:active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

type LedProps = {
  color: string;
  on: boolean;
  blink?: boolean;
  size?: number;
  className?: string;
};

export function Led({ color, on, blink = false, size = 10, className = "" }: LedProps) {
  const reduce = useReducedMotion();
  return (
    <span
      aria-hidden
      className={`relative inline-block shrink-0 rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        // Unlit plastic: the LED's own color under a dark film.
        background: `linear-gradient(rgb(0 0 0 / 0.6), rgb(0 0 0 / 0.6)), ${color}`,
        boxShadow: "0 0 0 1px rgb(0 0 0 / 0.45)",
      }}
    >
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ background: color, boxShadow: `0 0 ${size}px ${color}` }}
        initial={false}
        animate={
          on && blink && !reduce
            ? { opacity: [1, 0.25, 1], transition: { duration: 0.9, repeat: Infinity, ease: "easeInOut" } }
            : { opacity: on ? 1 : 0, transition: { duration: 0.15, ease: "easeOut" } }
        }
      />
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle at 35% 30%, rgb(255 255 255 / 0.55), transparent 50%)",
          boxShadow: "inset 0 -1px 2px rgb(0 0 0 / 0.45)",
        }}
      />
    </span>
  );
}

/** The big blue lens. It breathes while the Pokémon cries or data loads. */
export function Lens({ active }: { active: boolean }) {
  const reduce = useReducedMotion();
  return (
    <span
      aria-hidden
      className="relative grid size-12 shrink-0 place-items-center rounded-full"
      style={{
        background: "linear-gradient(160deg, #f4f4f2, #b9b8b3)",
        boxShadow: "0 2px 0 rgb(0 0 0 / 0.45), inset 0 -2px 3px rgb(0 0 0 / 0.25)",
      }}
    >
      <span
        className="relative size-9 overflow-hidden rounded-full"
        style={{
          background: "radial-gradient(circle at 50% 60%, #38bdf8 0%, #0369a1 60%, #082f49 100%)",
          boxShadow: "inset 0 0 0 1.5px rgb(0 0 0 / 0.5)",
        }}
      >
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ background: "radial-gradient(circle at 50% 55%, #bae6fd, #38bdf8 45%, transparent 75%)" }}
          initial={false}
          animate={
            active && !reduce
              ? { opacity: [0.25, 0.9, 0.25], transition: { duration: 1.1, repeat: Infinity, ease: "easeInOut" } }
              : { opacity: active ? 0.7 : 0, transition: { duration: 0.2, ease: "easeOut" } }
          }
        />
        <span className="absolute top-1.5 left-2 h-2 w-3 -rotate-[25deg] rounded-full bg-white/70 blur-[1px]" />
      </span>
    </span>
  );
}

/** Speaker grille slots, printed into the bezel. */
export function Grille({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden className={`flex flex-col gap-[3px] ${className}`}>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="h-[2px] w-6 rounded-full bg-black/35 shadow-[0_1px_0_rgb(255_255_255/0.5)]" />
      ))}
    </span>
  );
}

/** The stepped seam under the lid, like the original device's top half. */
export function LidSeam() {
  return (
    <svg aria-hidden viewBox="0 0 400 14" preserveAspectRatio="none" className="pointer-events-none block h-3.5 w-full">
      <path d="M0 3H210L232 11H400" fill="none" stroke="rgb(0 0 0 / 0.45)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
      <path d="M0 5H209.5L231.5 13H400" fill="none" stroke="rgb(255 255 255 / 0.16)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
