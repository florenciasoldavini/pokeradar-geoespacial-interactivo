"use client";

import { SpeakerIcon } from "@/components/ui/icons";

type SoundToggleProps = {
  enabled: boolean;
  onToggle: () => void;
};

export function SoundToggle({ enabled, onToggle }: SoundToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      aria-label={
        enabled ? "Silenciar el grito al capturar" : "Activar el grito al capturar"
      }
      title={enabled ? "Grito al capturar: activado" : "Grito al capturar: silenciado"}
      className={`pointer-events-auto grid size-9 shrink-0 cursor-pointer sm:size-10 place-items-center rounded-full border border-white/10 bg-panel/80 backdrop-blur-md transition-colors hover:bg-white/10 ${
        enabled ? "text-white" : "text-white/40"
      }`}
    >
      <SpeakerIcon muted={!enabled} className="size-4" />
    </button>
  );
}
