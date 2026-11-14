"use client";

import { Sprite } from "@/components/pokemon/sprite";
import { TypeIcon } from "@/components/pokemon/type-icon";
import { TEAM_SIZE, type TeamMember } from "@/hooks/use-team";
import { plural } from "@/lib/format";
import { TYPE_META, typeIconUrl } from "@/lib/pokemon-types";
import type { Zone } from "@/lib/zones";
import { isSharedWeakness, teamThreats } from "@/lib/team-coverage";
import { CART_LEGEND, Cartridge, Lcd, keyClass, type Placement } from "@/components/device/parts";

type TeamPanelProps = {
  placement: Placement;
  screenHeight: number;
  team: readonly TeamMember[];
  zones: readonly Zone[];
  onFocus: (member: TeamMember) => void;
  onRelease: (id: number) => void;
  onClose: () => void;
};

/**
 * The EQUIPO key's cartridge:
 * your six, where you caught them, and the types that hit the team hard.
 */
export function TeamPanel({ placement, screenHeight, team, zones, onFocus, onRelease, onClose }: TeamPanelProps) {
  const threats = teamThreats(team);
  const typesOnTeam = [...new Set(team.flatMap((m) => m.types))];

  return (
    <Cartridge
      id="bz-team"
      placement={placement}
      screenHeight={screenHeight}
      label="Equipo de expedición"
      aside={`${team.length}/${TEAM_SIZE}`}
      led="#f59e0b"
      ariaLabel="Equipo de expedición"
      closeLabel="Cerrar el equipo"
      onClose={onClose}
      fit
      expandable
    >
      {team.length === 0 ? (
        <Lcd className="shrink-0 px-4 py-6 text-center">
          <p className="dex-font-lcd dex-lcd-text text-sm uppercase">Equipo vacío</p>
          <p className="mx-auto mt-2 max-w-[30ch] text-[13.5px] leading-snug text-white/75">
            Abrí la ficha de un Pokémon en el mapa y tocá <strong className="text-white">Capturar</strong>. Acá vas a
            ver qué tipos le hacen daño a todo tu equipo.
          </p>
        </Lcd>
      ) : (
        <>
          <ul className="grid shrink-0 grid-cols-1 gap-1">
            {team.map((member) => {
              const zone = zones.find((z) => z.id === member.zoneId);
              return (
                <li key={member.id} className="dex-recess flex min-w-0 items-center gap-2 rounded-xl py-1 pr-1.5 pl-1">
                  <button
                    type="button"
                    onClick={() => onFocus(member)}
                    title="Volar a donde lo capturaste"
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    {member.sprite && (
                      <Sprite
                        src={member.sprite}
                        alt=""
                        width={40}
                        height={40}
                        className="size-10 shrink-0 object-contain [image-rendering:pixelated]"
                      />
                    )}
                    <span className="min-w-0">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-sm font-semibold text-white">{member.name}</span>
                        {/* Icons only: the damage grid below names every type. */}
                        {member.types.map((t) => (
                          <TypeIcon key={t} type={t} size={14} />
                        ))}
                      </span>
                      {zone && <span className="block truncate text-xs text-white/60">{zone.name}</span>}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRelease(member.id)}
                    aria-label={`Liberar a ${member.name}`}
                    className={`${keyClass()} h-8 shrink-0 rounded-lg px-2.5 text-xs font-medium`}
                  >
                    Liberar
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Icons only: the grid below names every type. */}
          <div className="flex shrink-0 flex-wrap items-center gap-1.5 px-0.5">
            <span className="text-xs text-white/60">Tipos en el equipo ({typesOnTeam.length}/18):</span>
            {typesOnTeam.map((type) => (
              <TypeIcon key={type} type={type} size={18} />
            ))}
          </div>

          <div className="mt-1 flex shrink-0 items-baseline justify-between px-0.5">
            <h3 className={CART_LEGEND}>Daño recibido por tipo</h3>
            <span className="text-[11px] text-white/55">▲ débiles · ▼ resisten</span>
          </div>
          <Lcd className="shrink-0 p-2">
            <ul className="grid grid-cols-3 gap-1">
              {threats.map((threat) => {
                const danger = isSharedWeakness(threat);
                const net = threat.weak - threat.resist;
                const { label, color } = TYPE_META[threat.type];
                return (
                  <li
                    key={threat.type}
                    title={`${label}: ${plural(threat.weak, "débil", "débiles")}, ${threat.resist} ${threat.resist === 1 ? "resiste" : "resisten"}`}
                    className={`rounded-[5px] px-1.5 py-1 ${
                      danger ? "bg-red-500/20 shadow-[inset_0_0_0_1px_rgb(248_113_113/0.6)]" : "bg-white/[0.03]"
                    }`}
                  >
                    <span className="dex-font-lcd flex items-center gap-1 text-[11px] leading-tight" style={{ color }}>
                      <Sprite
                        src={typeIconUrl(threat.type)}
                        alt=""
                        width={14}
                        height={14}
                        className="size-3.5 shrink-0 rounded-full"
                      />
                      <span className="truncate">{label}</span>
                    </span>
                    <span className="dex-font-lcd mt-1.5 flex gap-1.5 text-xs leading-none tabular-nums">
                      <span className={threat.weak ? (net > 0 ? "text-red-300" : "text-white/75") : "text-white/25"}>
                        ▲{threat.weak}
                      </span>
                      <span className={threat.resist ? "text-radar" : "text-white/25"}>▼{threat.resist}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Lcd>

        </>
      )}
    </Cartridge>
  );
}
