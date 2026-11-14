"use client";

import { useEffect, useState, type PointerEvent, type ReactNode } from "react";
import { animate, motion, useDragControls, useMotionValue, type PanInfo } from "framer-motion";
import { KEY_BASE, Led } from "@/components/device/hardware";
import { CloseIcon } from "@/components/ui/icons";
import { useFocusHandoff } from "@/hooks/use-focus-handoff";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/*
 * Device parts shared by the chrome and the cartridges. Presses are a
 * translate plus a shadow swap, so only transform ever animates.
 */

const KEY_SURFACE = "bg-[linear-gradient(180deg,#2b3038,#1a1d22)]";
const KEY_UP =
  "text-white/80 hover:text-white shadow-[0_2px_0_rgb(0_0_0/0.55),inset_0_1px_0_rgb(255_255_255/0.12)] active:shadow-[0_0.5px_0_rgb(0_0_0/0.55),inset_0_1px_2px_rgb(0_0_0/0.5)]";
/** Latched: the key stays sunk while its cartridge is in. */
const KEY_DOWN = "translate-y-[1.5px] text-white shadow-[0_0.5px_0_rgb(0_0_0/0.55),inset_0_1px_3px_rgb(0_0_0/0.65)]";

export function keyClass(latched = false) {
  return `${KEY_BASE} ${KEY_SURFACE} ${latched ? KEY_DOWN : KEY_UP}`;
}

/** The one primary action of a cartridge: a lit green key. */
export const GREEN_KEY = `${KEY_BASE} bg-[linear-gradient(180deg,#7af0b4,#3fd68d)] text-[#04281a] shadow-[0_3px_0_#1d8a56,inset_0_1px_0_rgb(255_255_255/0.5)] hover:text-[#021a10] active:translate-y-[2px] active:shadow-[0_1px_0_#1d8a56,inset_0_1px_2px_rgb(0_0_0/0.25)] disabled:bg-none disabled:bg-white/10 disabled:text-white/50 disabled:shadow-[0_3px_0_rgb(0_0_0/0.4)]`;

/** Engraved legend on the red plastic. */
export const LEGEND =
  "dex-font-display text-[10px] font-semibold tracking-[0.14em] text-white/75 uppercase [text-shadow:0_1px_0_rgb(0_0_0/0.45)]";

/** Section legend inside a cartridge. */
export const CART_LEGEND = "dex-font-display text-[11px] font-semibold tracking-[0.14em] text-white/55 uppercase";

/** Dark LCD window with scanlines. */
export function Lcd({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`dex-lcd relative overflow-hidden rounded-[10px] ${className}`}>{children}</div>;
}

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/* ── Cartridge ─────────────────────────────────────────────────────── */

export type Placement = "left" | "right" | "sheet";

type CartridgeProps = {
  id: string;
  placement: Placement;
  /** Bold text on the label sticker. */
  label: string;
  /** Small text at the sticker's right end. */
  aside?: ReactNode;
  led: string;
  ariaLabel: string;
  closeLabel: string;
  onClose: () => void;
  footer?: ReactNode;
  /** Desktop: hug the content instead of filling the screen's height. */
  fit?: boolean;
  /** Sheet: can be dragged up to read the whole thing. */
  expandable?: boolean;
  /** Height of the lit screen, for the sheet's peek/expanded stops. */
  screenHeight: number;
  children: ReactNode;
};

const SLIDE = { type: "tween", ease: [0.22, 0.9, 0.3, 1], duration: 0.26 } as const;
const SLIDE_OUT = { type: "tween", ease: [0.4, 0, 1, 1], duration: 0.18 } as const;
const INSTANT = { duration: 0 } as const;

/** Share of the screen a sheet covers at rest; the map keeps the rest. */
export const SHEET_PEEK = 0.55;
const SHEET_FULL = 0.92;

/**
 * A cartridge slides in from an edge of the lit screen. Desktop: a side
 * panel (zone, rastreo and equipo on the left; ficha and filters on the
 * right). Phones: a bottom sheet you drag down to put away, or up to read.
 */
export function Cartridge(props: CartridgeProps) {
  return props.placement === "sheet" ? <Sheet {...props} /> : <SidePanel {...props} />;
}

function SidePanel({ id, placement, ariaLabel, fit, children, footer, ...label }: CartridgeProps) {
  const reduce = useReducedMotion();
  const focusRef = useFocusHandoff<HTMLElement>();
  const away = placement === "left" ? "calc(-100% - 40px)" : "calc(100% + 40px)";
  return (
    <motion.section
      ref={focusRef}
      id={id}
      role="region"
      aria-label={ariaLabel}
      tabIndex={-1}
      initial={reduce ? { opacity: 0 } : { x: away, opacity: 0 }}
      animate={{ x: 0, opacity: 1, transition: reduce ? INSTANT : SLIDE }}
      exit={reduce ? { opacity: 0, transition: INSTANT } : { x: away, opacity: 0, transition: SLIDE_OUT }}
      className={`bz-cart absolute top-3 z-20 flex flex-col overflow-hidden rounded-[18px] outline-none ${
        fit ? "max-h-[calc(100%-24px)]" : "bottom-3"
      } ${placement === "left" ? "left-3 w-[328px]" : "right-3 w-[372px]"}`}
    >
      <CartLabel {...label} side={placement} />
      <CartBody footer={footer}>{children}</CartBody>
    </motion.section>
  );
}

function Sheet({ id, ariaLabel, expandable, screenHeight, onClose, children, footer, ...label }: CartridgeProps) {
  const reduce = useReducedMotion();
  const focusRef = useFocusHandoff<HTMLElement>();
  const dragControls = useDragControls();
  const full = Math.round(screenHeight * SHEET_FULL);
  const peek = Math.round(screenHeight * SHEET_PEEK);
  const rest = expandable ? full - peek : 0;
  const [expanded, setExpanded] = useState(false);
  // Expandable sheets are full height and parked low: only `peek` shows.
  const y = useMotionValue(expandable ? full : 0);
  const target = expanded ? 0 : rest;

  useEffect(() => {
    if (!expandable) return;
    const controls = animate(y, target, reduce ? INSTANT : SLIDE);
    return () => controls.stop();
  }, [expandable, target, reduce, y]);

  function onDragEnd(_: unknown, info: PanInfo) {
    const at = y.get();
    // Fixed-height sheets don't bind `y` (framer drags their own transform),
    // so measure how far the finger pulled instead.
    const pulled = expandable ? at - rest : info.offset.y;
    if (pulled > 90 || (info.velocity.y > 600 && !expanded)) return onClose();
    if (!expandable) return;
    const next = info.velocity.y < -400 ? true : info.velocity.y > 400 ? false : at < rest / 2;
    setExpanded(next);
    // Same stop as before: the effect won't rerun, so settle it here.
    if (next === expanded) animate(y, next ? 0 : rest, reduce ? INSTANT : SLIDE);
  }

  function startDrag(event: PointerEvent) {
    if (event.target instanceof Element && event.target.closest("button:not([data-handle])")) return;
    dragControls.start(event);
  }

  return (
    <motion.section
      ref={focusRef}
      id={id}
      role="region"
      aria-label={ariaLabel}
      tabIndex={-1}
      style={expandable ? { y, height: full } : undefined}
      initial={expandable ? false : reduce ? { opacity: 0 } : { y: "100%" }}
      animate={expandable ? undefined : { y: 0, opacity: 1, transition: reduce ? INSTANT : SLIDE }}
      exit={
        reduce
          ? { opacity: 0, transition: INSTANT }
          : { y: expandable ? full : "100%", transition: SLIDE_OUT }
      }
      drag="y"
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      dragConstraints={{ top: 0, bottom: rest }}
      dragElastic={{ top: 0.08, bottom: 0.6 }}
      onDragEnd={onDragEnd}
      className={`bz-cart absolute inset-x-0 bottom-0 z-20 mx-auto flex max-w-xl flex-col overflow-hidden rounded-t-[20px] outline-none ${
        expandable ? "" : "max-h-[55%]"
      }`}
    >
      <div onPointerDown={startDrag} className="shrink-0 cursor-grab touch-none active:cursor-grabbing">
        <CartLabel {...label} onClose={onClose} side="sheet" />
        {expandable && (
          <button
            type="button"
            data-handle
            onClick={() => setExpanded((open) => !open)}
            aria-expanded={expanded}
            aria-label={expanded ? "Mostrar menos" : "Mostrar más"}
            className="absolute top-0 left-1/2 h-4 w-16 -translate-x-1/2 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white"
          />
        )}
      </div>
      <CartBody footer={footer} bottomPad={expanded ? 0 : rest}>
        {children}
      </CartBody>
    </motion.section>
  );
}

function CartLabel({
  label,
  aside,
  led,
  closeLabel,
  onClose,
  side,
}: Pick<CartridgeProps, "label" | "aside" | "led" | "closeLabel" | "onClose"> & { side: Placement }) {
  return (
    <header
      className={`bz-cart-label relative flex shrink-0 items-center gap-2.5 ${
        side === "sheet" ? "px-3 pt-4 pb-2.5" : side === "left" ? "py-2.5 pr-4 pl-3" : "py-2.5 pr-3 pl-4"
      }`}
    >
      {side === "sheet" ? (
        <span
          aria-hidden
          className="absolute top-1.5 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-black/40 shadow-[0_1px_0_rgb(255_255_255/0.15)]"
        />
      ) : (
        <span aria-hidden className={`bz-grip absolute inset-y-0 w-1.5 ${side === "left" ? "right-0" : "left-0"}`} />
      )}
      <span className="bz-sticker flex min-w-0 flex-1 items-center gap-2 rounded-[6px] px-2.5 py-1.5">
        <Led color={led} on size={7} />
        <span className="dex-font-display truncate text-xs leading-none font-bold tracking-[0.12em] uppercase">
          {label}
        </span>
        {aside && (
          <span className="dex-font-lcd ml-auto shrink-0 text-xs leading-none text-[#5e564e]">{aside}</span>
        )}
      </span>
      <button
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
        title={`${closeLabel} (Esc)`}
        className={`${keyClass()} grid size-9 shrink-0 place-items-center rounded-full lg:size-8`}
      >
        <CloseIcon className="size-3.5" />
      </button>
    </header>
  );
}

function CartBody({ children, footer, bottomPad = 0 }: { children: ReactNode; footer?: ReactNode; bottomPad?: number }) {
  return (
    <>
      <div
        className="bz-scroll flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain p-3"
        style={bottomPad && !footer ? { paddingBottom: bottomPad + 12 } : undefined}
      >
        {children}
      </div>
      {footer && (
        <div
          className="shrink-0 border-t border-black/50 px-3 pt-2.5 pb-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]"
          style={bottomPad ? { marginBottom: bottomPad } : undefined}
        >
          {footer}
        </div>
      )}
    </>
  );
}

/* ── Icons ─────────────────────────────────────────────────────────── */

export function LightningIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" className={className} aria-hidden>
      <path d="M13 2.5 5 13.5h6l-1 8 8-11h-6z" />
    </svg>
  );
}

export function Triangle({ rotate, className = "size-2.5" }: { rotate: number; className?: string }) {
  return (
    <svg viewBox="0 0 10 10" className={className} style={{ rotate: `${rotate}deg` }} aria-hidden>
      <path d="M5 2 9 8H1z" fill="currentColor" />
    </svg>
  );
}

export function WaveIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className={className} aria-hidden>
      <path d="M6 9v6M10 6v12M14 9v6M18 7v10" />
    </svg>
  );
}

/** Target-lock corners, drawn in currentColor. */
export function Brackets() {
  return (
    <svg viewBox="0 0 24 24" className="size-full" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden>
      <path d="M1 7V1h6M17 1h6v6M23 17v6h-6M7 23H1v-6" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
