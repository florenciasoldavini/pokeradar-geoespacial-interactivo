"use client"; // Error boundaries must be Client Components.

import { DeviceMessage } from "@/components/device/device-message";
import { GREEN_KEY } from "@/components/device/parts";

/**
 * Last line of defense for an unexpected render error. Per-feature failures
 * (map, PokéAPI, Open-Meteo) are handled inline and never reach this screen.
 */
export default function RadarError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <DeviceMessage
      code="Radar fuera de línea"
      title="Algo falló en la Pokédex"
      body="Probá de nuevo; si sigue pasando, recargá la página."
      action={
        <button
          type="button"
          onClick={() => retry()}
          className={`${GREEN_KEY} dex-font-display rounded-xl px-5 py-2.5 text-sm font-bold`}
        >
          Reintentar
        </button>
      }
    />
  );
}
