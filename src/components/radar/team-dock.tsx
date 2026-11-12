"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { PokeballIcon } from "@/components/ui/icons";
import { TEAM_SIZE, type TeamMember } from "@/hooks/use-team";
import { TYPE_META } from "@/lib/pokemon-types";

type TeamDockProps = {
  team: readonly TeamMember[];
  onSelect: (member: TeamMember) => void;
};

/** Up to six caught Pokémon. Clicking one flies back to where it was found. */
export function TeamDock({ team, onSelect }: TeamDockProps) {
  return (
    <section
      aria-label="Equipo de expedición"
      className="pointer-events-auto rounded-2xl border border-white/10 bg-panel/80 px-4 py-2.5 backdrop-blur-md"
    >
      <p className="font-mono text-[10px] tracking-wider text-white/45 uppercase">
        Equipo{" "}
        <span className="text-white/70 tabular-nums">
          {team.length}/{TEAM_SIZE}
        </span>
      </p>
      {/* Fluid square slots: they share whatever width the column has
          (narrow phones) and cap at 36px (desktop). */}
      <ol className="mt-1.5 flex justify-between gap-1 sm:gap-1.5">
        {Array.from({ length: TEAM_SIZE }, (_, slot) => {
          const member = team[slot];
          const color = member?.types[0] ? TYPE_META[member.types[0]].color : undefined;
          return (
            <li key={slot} className="relative aspect-square max-w-9 min-w-0 flex-1 sm:min-w-9">
              {/* Empty slot: a faint Pokéball outline. */}
              <span className="absolute inset-0 grid place-items-center rounded-full border border-dashed border-white/12 text-white/12">
                <PokeballIcon className="size-[45%]" />
              </span>
              <AnimatePresence>
                {member && (
                  <motion.button
                    key={member.id}
                    type="button"
                    onClick={() => onSelect(member)}
                    aria-label={`${member.name}: ir a donde lo capturaste`}
                    title={member.name}
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, opacity: 0 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 420, damping: 18 }}
                    className="absolute inset-0 grid cursor-pointer place-items-center rounded-full border bg-panel"
                    style={{
                      borderColor: color ? `${color}80` : undefined,
                      backgroundColor: color ? `${color}1f` : undefined,
                    }}
                  >
                    {member.sprite && (
                      <Image
                        src={member.sprite}
                        alt=""
                        width={28}
                        height={28}
                        unoptimized
                        className="size-[78%] object-contain [image-rendering:pixelated]"
                      />
                    )}
                  </motion.button>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
