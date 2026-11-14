import { GREEN_KEY } from "@/components/device/parts";

/** The screen warming up while MapLibre, the style and the tiles load. */
export function ScreenWarmup() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-[#06110c]">
      <div className="relative grid size-40 place-items-center rounded-full border border-radar/20">
        <div className="absolute inset-6 rounded-full border border-radar/15" />
        <div className="bz-spin absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_75%,var(--color-radar))] opacity-40" />
        <span className="dex-font-lcd dex-lcd-text relative text-sm uppercase">Encendiendo…</span>
      </div>
    </div>
  );
}

/** The map couldn't start (style unreachable, no WebGL). The rest of the device keeps working. */
export function ScreenError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="absolute inset-0 grid place-items-center bg-[#06110c] p-6 text-center">
      <div className="flex max-w-72 flex-col items-center gap-3">
        <p className="dex-font-lcd dex-lcd-text text-sm uppercase">Sin señal del mapa</p>
        <p className="text-sm text-white/70">
          No pudimos cargar el mapa. Revisá tu conexión; las zonas siguen disponibles con ▲ ▼.
        </p>
        <button type="button" onClick={onRetry} className={`${GREEN_KEY} rounded-xl px-4 py-2 text-sm font-semibold`}>
          Reintentar
        </button>
      </div>
    </div>
  );
}
