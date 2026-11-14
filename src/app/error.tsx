"use client"; // Error boundaries must be Client Components.

/**
 * Last line of defense for an unexpected render error. Per-feature failures
 * (map, PokéAPI, Open-Meteo) are handled inline and never reach this screen.
 */
export default function RadarError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="grid h-dvh place-items-center bg-radar-bg p-6 text-center">
      <div className="max-w-sm">
        <div className="mx-auto grid size-20 place-items-center rounded-full border border-red-400/30">
          <span className="size-3 rounded-full bg-red-400 shadow-[0_0_16px] shadow-red-400" />
        </div>
        <p className="mt-6 font-mono text-[11px] tracking-wider text-red-300 uppercase">
          Radar fuera de línea
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          No pudimos iniciar el mapa
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Puede ser un problema de conexión o que tu navegador no soporte WebGL.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          className="mt-6 cursor-pointer rounded-full bg-radar px-5 py-2 text-sm font-semibold text-radar-bg transition-opacity hover:opacity-90"
        >
          Reintentar
        </button>
      </div>
    </main>
  );
}
