"use client";

import { motion } from "framer-motion";

/** Highest base stat in the games (Blissey's HP), used as the bar's 100%. */
const MAX_STAT = 255;

type StatBarProps = {
  label: string;
  value: number;
  color: string;
  index: number;
};

/** One row of a <dl>: label in <dt>, number + bar in <dd>. */
export function StatBar({ label, value, color, index }: StatBarProps) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] items-center gap-3">
      <dt className="text-xs text-white/55">{label}</dt>
      <dd className="grid grid-cols-[2.25rem_1fr] items-center gap-3">
        <span className="text-right font-mono text-sm tabular-nums">{value}</span>
        <span className="h-1.5 overflow-hidden rounded-full bg-white/8" aria-hidden>
          <motion.span
            className="block h-full origin-left rounded-full"
            style={{
              backgroundColor: color,
              width: `${(value / MAX_STAT) * 100}%`,
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{
              delay: 0.15 + index * 0.06,
              type: "spring",
              stiffness: 120,
              damping: 20,
            }}
          />
        </span>
      </dd>
    </div>
  );
}
