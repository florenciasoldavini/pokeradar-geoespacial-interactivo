/**
 * One shared <audio> for every cry: starting a new one cuts the previous, and
 * any component can subscribe to "which Pokémon is crying right now".
 */

const VOLUME = 0.4;

let audio: HTMLAudioElement | null = null;
let playingId: number | null = null;
const listeners = new Set<() => void>();

function setPlaying(id: number | null) {
  playingId = id;
  for (const listener of listeners) listener();
}

/**
 * Call it from inside a click handler: browsers (Safari especially) only
 * allow sound that starts in direct response to a user gesture.
 */
export function playCry(id: number, url: string) {
  audio?.pause();
  const next = new Audio(url);
  next.volume = VOLUME;
  audio = next;
  next.addEventListener("ended", () => {
    if (audio === next) setPlaying(null);
  });
  setPlaying(id);
  next.play().catch(() => {
    // Blocked by autoplay policy or unsupported codec (.ogg on older
    // Safari). Cries are a bonus: fail quietly.
    if (audio === next) setPlaying(null);
  });
}

export function subscribeCry(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getPlayingCry(): number | null {
  return playingId;
}
