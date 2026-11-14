/**
 * Tiny synthesized UI sounds (Web Audio, no files), like an old handheld.
 * The context is created on the first sound, which always follows a user
 * gesture, so autoplay rules allow it.
 */

const VOLUME = 0.05;

let context: AudioContext | null = null;
/** When the last state sound (zone, Pokémon, panel) played. */
let lastStateSound = -Infinity;

function audio(): AudioContext | null {
  if (typeof window === "undefined" || !("AudioContext" in window)) return null;
  context ??= new AudioContext();
  if (context.state === "suspended") void context.resume();
  return context;
}

type Note = {
  type?: OscillatorType;
  /** Start frequency; glides to `to` if given. */
  from: number;
  to?: number;
  duration: number;
  delay?: number;
  volume?: number;
};

function note({ type = "square", from, to, duration, delay = 0, volume = VOLUME }: Note) {
  const ctx = audio();
  if (!ctx) return;
  const start = ctx.currentTime + delay;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(from, start);
  if (to) oscillator.frequency.exponentialRampToValueAtTime(to, start + duration);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration);
}

function stateSound(play: () => void) {
  lastStateSound = performance.now();
  play();
}

export const sfx = {
  /** Radar locking on: a sonar ping that drops, with a faint echo. */
  zone: () =>
    stateSound(() => {
      note({ type: "sine", from: 1400, to: 700, duration: 0.35, volume: 0.09 });
      note({ type: "sine", from: 1400, to: 700, duration: 0.3, delay: 0.22, volume: 0.035 });
    }),
  /** Something found: a quick rising arpeggio. */
  pokemon: () =>
    stateSound(() => {
      note({ from: 784, duration: 0.06 });
      note({ from: 988, duration: 0.06, delay: 0.06 });
      note({ from: 1319, duration: 0.12, delay: 0.12 });
    }),
  /** A panel slides in: a short rising sweep. */
  open: () => stateSound(() => note({ type: "triangle", from: 320, to: 820, duration: 0.13, volume: 0.08 })),
  /** A panel slides out: the same sweep, falling. */
  close: () => stateSound(() => note({ type: "triangle", from: 820, to: 320, duration: 0.13, volume: 0.08 })),
  /**
   * Any other key. Deferred a beat and dropped if the click already caused a
   * state sound, so keys that open panels don't double up.
   */
  press: () => {
    const clickedAt = performance.now();
    window.setTimeout(() => {
      if (lastStateSound >= clickedAt) return;
      note({ from: 1320, duration: 0.03, volume: 0.04 });
    }, 40);
  },
};
