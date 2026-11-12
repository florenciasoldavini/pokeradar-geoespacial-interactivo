"use client";

import { useRef, type KeyboardEvent, type PointerEvent } from "react";

type Thumb = 0 | 1;

type RangeSliderProps = {
  min: number;
  max: number;
  step: number;
  value: readonly [number, number];
  onChange: (value: [number, number]) => void;
  /** Accessible names for the two handles. */
  labels: readonly [string, string];
};

/**
 * Two-handle slider. Pressing anywhere on the track grabs the nearest handle
 * and drags it (pointer capture keeps the drag alive outside the track); each
 * handle is a focusable role="slider" driven by the keyboard.
 *
 * Replaces the common "two stacked <input type=range>" trick, which relies on
 * pointer-events on ::-webkit-slider-thumb and let the top input steal clicks
 * meant for the other handle.
 */
export function RangeSlider({ min, max, step, value, onChange, labels }: RangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<Thumb | null>(null);
  const thumbRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)] as const;

  const percent = (n: number) => ((n - min) / (max - min)) * 100;

  /** Moves one handle, snapped to `step` and never crossing the other. */
  function setThumb(thumb: Thumb, raw: number) {
    const snapped = Math.round((raw - min) / step) * step + min;
    const [low, high] = value;
    const next: [number, number] =
      thumb === 0
        ? [Math.max(min, Math.min(snapped, high - step)), high]
        : [low, Math.min(max, Math.max(snapped, low + step))];
    if (next[0] !== low || next[1] !== high) onChange(next);
  }

  function valueAt(clientX: number): number {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return min;
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    return min + ratio * (max - min);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    const raw = valueAt(event.clientX);
    const [low, high] = value;
    // Nearest handle wins; on a tie (handles stacked) pick by direction.
    const thumb: Thumb =
      Math.abs(raw - low) < Math.abs(raw - high) || (low === high - step && raw < low)
        ? 0
        : 1;
    draggingRef.current = thumb;
    event.currentTarget.setPointerCapture(event.pointerId);
    thumbRefs[thumb].current?.focus();
    setThumb(thumb, raw);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (draggingRef.current === null) return;
    setThumb(draggingRef.current, valueAt(event.clientX));
  }

  function onPointerUp() {
    draggingRef.current = null;
  }

  function onKeyDown(thumb: Thumb, event: KeyboardEvent<HTMLDivElement>) {
    const current = value[thumb];
    const big = step * 5;
    const moves: Record<string, number> = {
      ArrowLeft: current - step,
      ArrowDown: current - step,
      ArrowRight: current + step,
      ArrowUp: current + step,
      PageDown: current - big,
      PageUp: current + big,
      Home: min,
      End: max,
    };
    const target = moves[event.key];
    if (target === undefined) return;
    event.preventDefault();
    setThumb(thumb, target);
  }

  return (
    <div
      ref={trackRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="relative h-6 cursor-pointer touch-none select-none"
    >
      <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/10" />
      <div
        className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-radar"
        style={{ left: `${percent(value[0])}%`, right: `${100 - percent(value[1])}%` }}
      />
      {([0, 1] as const).map((thumb) => (
        <div
          key={thumb}
          ref={thumbRefs[thumb]}
          role="slider"
          tabIndex={0}
          aria-label={labels[thumb]}
          aria-valuemin={thumb === 0 ? min : value[0] + step}
          aria-valuemax={thumb === 0 ? value[1] - step : max}
          aria-valuenow={value[thumb]}
          onKeyDown={(event) => onKeyDown(thumb, event)}
          className="absolute top-1/2 size-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-panel bg-radar shadow-[0_0_0_1px_var(--color-radar)] outline-none transition-shadow focus-visible:shadow-[0_0_0_1px_var(--color-radar),0_0_0_5px_rgb(92_242_165/0.3)]"
          style={{ left: `${percent(value[thumb])}%` }}
        />
      ))}
    </div>
  );
}
