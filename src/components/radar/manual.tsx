"use client";

import { useCallback, useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CART_LEGEND, GREEN_KEY, Lcd } from "@/components/device/parts";

const STEPS = [
  {
    title: "Elegí una zona",
    body: "Cada punto es un lugar real de Argentina con su hábitat. Tocalo, o usá ▲ ▼, y el radar barre la zona.",
  },
  {
    title: "Seguí el clima",
    body: "El clima en vivo potencia algunos tipos y trae un visitante. El rayo (Rastreo) te lleva de uno a otro.",
  },
  {
    title: "Armá tu equipo",
    body: "Capturá hasta seis. Tocá uno abajo para volar a donde lo capturaste; Equipo muestra sus puntos débiles.",
  },
] as const;

const SHORTCUTS: readonly (readonly [string, string])[] = [
  ["N / S", "Zona al norte / al sur"],
  ["P", "Próximo potenciado"],
  ["F", "Filtros"],
  ["E", "Equipo"],
  ["C", "Capturar"],
  ["G", "Grito"],
  ["[ ]", "Pokémon anterior / siguiente"],
  ["M", "Grito al capturar"],
  ["Esc", "Volver un paso"],
  ["?", "Este manual"],
];

/**
 * Quick-start card. Boots by itself on the first visit; "?" (or the lens on
 * phones) brings it back.
 */
export function Manual({ firstRun, onClose }: { firstRun: boolean; onClose: () => void }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      // Covers the whole device, not just the screen, so no key looks live behind it.
      className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-black/65 p-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="bz-manual-title"
        initial={reduce ? false : { opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.24, ease: [0.22, 0.9, 0.3, 1], delay: firstRun && !reduce ? 0.3 : 0 }}
        className="bz-cart relative w-full max-w-[30rem] overflow-hidden rounded-[20px]"
      >
        <header className="bz-cart-label flex items-center gap-2.5 px-3 py-2.5">
          <span className="bz-sticker dex-font-display flex-1 rounded-[6px] px-2.5 py-1.5 text-xs leading-none font-bold tracking-[0.12em] uppercase">
            Manual de bolsillo
          </span>
        </header>
        <div className="p-3">
          <Lcd className="px-4 pt-3.5 pb-4">
            <p className="dex-font-lcd text-[11px] tracking-[0.12em] text-radar/65 uppercase">
              {firstRun ? "Sistema listo" : "Cómo se usa"}
            </p>
            <h2 id="bz-manual-title" className="dex-font-display mt-1 text-xl font-bold tracking-tight text-white">
              {firstRun ? "Te damos la bienvenida" : "Cómo usar el PokéRadar"}
            </h2>
            <ol className="mt-3 space-y-3">
              {STEPS.map((step, i) => (
                <motion.li
                  key={step.title}
                  className="flex gap-3"
                  initial={reduce ? false : { opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (firstRun ? 0.45 : 0.06) + i * 0.06, duration: 0.2, ease: "easeOut" }}
                >
                  <span className="dex-font-lcd dex-lcd-text mt-px text-base leading-5">0{i + 1}</span>
                  <span>
                    <span className="block text-sm font-semibold text-white">{step.title}</span>
                    <span className="block text-[13.5px] leading-snug text-white/75">{step.body}</span>
                  </span>
                </motion.li>
              ))}
            </ol>
          </Lcd>

          <div className="mt-3 hidden lg:block">
            <h3 className={`${CART_LEGEND} px-1`}>Atajos de teclado</h3>
            <dl className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 px-1">
              {SHORTCUTS.map(([keys, action]) => (
                <div key={keys} className="flex items-center gap-2 text-[12.5px]">
                  <dt className="dex-font-lcd min-w-11 rounded-[4px] bg-black/40 px-1.5 py-0.5 text-center text-radar shadow-[inset_0_1px_2px_rgb(0_0_0/0.6)]">
                    {keys}
                  </dt>
                  <dd className="text-white/70">{action}</dd>
                </div>
              ))}
            </dl>
          </div>

          <button
            type="button"
            onClick={onClose}
            autoFocus
            className={`${GREEN_KEY} dex-font-display mt-3.5 flex h-11 w-full items-center justify-center rounded-xl text-sm font-bold tracking-wide uppercase`}
          >
            {firstRun ? "Encender radar" : "Entendido"}
          </button>
        </div>
      </motion.section>
    </motion.div>
  );
}

const KEY = "pokeradar:manual-seen";
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function getSnapshot(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "seen";
  } catch {
    return true; // Storage blocked: never nag on every visit.
  }
}

/**
 * Whether the first-run manual was already read. The server snapshot says
 * "seen", so returning visitors never get a flash of it on hydration.
 */
export function useManualSeen(): [seen: boolean, markSeen: () => void] {
  const seen = useSyncExternalStore(subscribe, getSnapshot, () => true);
  const markSeen = useCallback(() => {
    try {
      window.localStorage.setItem(KEY, "seen");
    } catch {
      // Not persisted; it simply shows again next visit.
    }
    for (const listener of listeners) listener();
  }, []);
  return [seen, markSeen];
}
