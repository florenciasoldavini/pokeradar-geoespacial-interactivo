const BASE_URL = "https://pokeapi.co/api/v2";
/** A hung request must not stall a build or leave a skeleton up forever. */
const TIMEOUT_MS = 10_000;

export class PokeApiError extends Error {
  constructor(
    readonly path: string,
    readonly status: number,
  ) {
    super(`PokéAPI ${path} respondió ${status}`);
    this.name = "PokeApiError";
  }
}

/**
 * Typed GET against PokéAPI, shared by server and client code. The generic is
 * an assertion about the response shape (see ./types.ts), not a runtime check.
 */
export async function fetchPokeApi<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    // Callers that pass their own signal (to abort on unmount) manage it.
    signal: init?.signal ?? AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new PokeApiError(path, response.status);
  const body: unknown = await response.json();
  return body as T;
}

/** "https://pokeapi.co/api/v2/pokemon-species/41/" → 41 */
export function idFromResourceUrl(url: string): number {
  const match = /\/(\d+)\/?$/.exec(url);
  if (!match?.[1]) throw new Error(`URL de recurso inesperada: ${url}`);
  return Number(match[1]);
}
